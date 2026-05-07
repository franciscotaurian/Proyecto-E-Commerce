package client

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"net/url"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

type R2Client struct {
	s3Client   *s3.Client
	bucketName string
	s3Endpoint string // URL para la API de S3 (cloudflarestorage.com)
	publicURL  string // URL para consumo público (r2.dev o dominio propio)
}

// NewR2Client inicializa el cliente requiriendo ambos endpoints
func NewR2Client(accountID, accessKeyID, secretAccessKey, bucketName, s3Endpoint, publicURL string) (*R2Client, error) {
	creds := credentials.NewStaticCredentialsProvider(accessKeyID, secretAccessKey, "")

	cfg, err := config.LoadDefaultConfig(context.Background(),
		config.WithCredentialsProvider(creds),
		config.WithRegion("auto"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load R2 config: %w", err)
	}

	// Limpiar la public URL para asegurar que no termine en slash
	cleanPublicURL := strings.TrimRight(publicURL, "/")

	return &R2Client{
		s3Client: s3.NewFromConfig(cfg, func(o *s3.Options) {
			o.BaseEndpoint = aws.String(s3Endpoint)
		}),
		bucketName: bucketName,
		s3Endpoint: s3Endpoint,
		publicURL:  cleanPublicURL,
	}, nil
}

// UploadImage decodifica y sube a R2 detectando el formato dinámicamente
func (r *R2Client) UploadImage(ctx context.Context, base64Image string, folder string) (string, error) {
	// 1. Extraer metadata y datos limpios
	parts := strings.Split(base64Image, ",")
	var base64Data, contentType string

	if len(parts) == 2 {
		base64Data = parts[1]
		// Extraer el mime type (ej: "data:image/png;base64" -> "image/png")
		mimeInfo := strings.Split(parts[0], ";")[0]
		contentType = strings.Replace(mimeInfo, "data:", "", 1)
	} else {
		return "", fmt.Errorf("invalid base64 image format")
	}

	// 2. Decodificar la imagen
	imageBytes, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64 image: %w", err)
	}

	// 3. Determinar extensión correcta
	extension := ".jpg"
	if strings.Contains(contentType, "png") {
		extension = ".png"
	} else if strings.Contains(contentType, "webp") {
		extension = ".webp"
	}

	// 4. Generar la ruta del objeto
	objectKey := uuid.New().String() + extension
	if folder != "" {
		objectKey = folder + "/" + objectKey
	}

	// 5. Subir a R2 (SIN el parámetro ACL)
	_, err = r.s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(r.bucketName),
		Key:         aws.String(objectKey),
		Body:        bytes.NewReader(imageBytes),
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload image to R2: %w", err)
	}

	// 6. Construir la URL pública final
	finalPublicURL := fmt.Sprintf("%s/%s", r.publicURL, objectKey)

	return finalPublicURL, nil
}

// DeleteImage elimina la imagen extrayendo la ruta con net/url
func (r *R2Client) DeleteImage(ctx context.Context, imageURL string) error {
	objectKey, err := r.extractObjectKey(imageURL)
	if err != nil {
		return err
	}

	_, err = r.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(r.bucketName),
		Key:    aws.String(objectKey),
	})
	if err != nil {
		return fmt.Errorf("failed to delete image from R2: %w", err)
	}

	return nil
}

// extractObjectKey usa net/url para extraer el path de forma segura
func (r *R2Client) extractObjectKey(imageURL string) (string, error) {
	parsedURL, err := url.Parse(imageURL)
	if err != nil {
		return "", fmt.Errorf("invalid URL: %w", err)
	}

	// El Path devuelto empieza con '/', se lo quitamos para R2
	objectKey := strings.TrimPrefix(parsedURL.Path, "/")
	if objectKey == "" {
		return "", fmt.Errorf("no object key found in URL")
	}

	// Opcional: Validar que el dominio de la URL coincida con tu publicURL
	// para evitar intentar borrar objetos de URLs externas por error.

	return objectKey, nil
}
