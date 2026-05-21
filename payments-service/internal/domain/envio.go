package domain

import (
	"errors"
	"os"
	"strconv"
)

type Shipping struct {
	ShippingMethod  ShippingMethod  `bson:"shipping_method" json:"shipping_method"`
	ShippingStatus  ShippingStatus  `bson:"shipping_status" json:"shipping_status"`
	ShippingAddress AddressShipment `bson:"shipping_address" json:"shipping_address"`
	ShippingCost    float64         `bson:"shipping_cost" json:"shipping_cost"`
	ShippedTrackID  string          `bson:"shipped_track_id,omitempty" json:"shipped_track_id,omitempty"`
}

const (
	ShippingMethodSend     string = "Send"
	ShippingMethodWhatsapp string = "Whatsapp"
)

type ShippingMethod string

const (
	ShippingSend     ShippingMethod = "Send"
	ShippingWhatsapp ShippingMethod = "Whatsapp"
)

type ShippingStatus string

const (
	ShippingPending   ShippingStatus = "Pending"
	ShippingShipped   ShippingStatus = "Shipped"
	ShippingDelivered ShippingStatus = "Delivered"
	ShippingCancelled ShippingStatus = "Cancelled"
)

type AddressShipment struct {
	Street    string `bson:"street" json:"street"`
	Number    string `bson:"number" json:"number"`
	Floor     string `bson:"floor" json:"floor"`
	Apartment string `bson:"apartment" json:"apartment"`
	City      string `bson:"city" json:"city"`
	Province  string `bson:"province" json:"province"`
	Country   string `bson:"country" json:"country"`
	ZipCode   string `bson:"zip_code" json:"zip_code"`
}

// Validate validates order data
func (s *Shipping) Validate() error {
	if s.ShippingMethod == "" {
		return errors.New("Shipping method required")
	}
	if s.ShippingAddress.Street == "" {
		return errors.New("shipping address is required")
	}
	if s.ShippingAddress.Number == "" {
		return errors.New("shipping address number is required")
	}
	if s.ShippingAddress.Floor == "" {
		return errors.New("shipping address floor is required")
	}
	if s.ShippingAddress.Apartment == "" {
		return errors.New("shipping address apartment is required")
	}
	if s.ShippingAddress.City == "" {
		return errors.New("shipping address city is required")
	}
	if s.ShippingAddress.Province == "" {
		return errors.New("shipping address province is required")
	}
	if s.ShippingAddress.Country == "" {
		return errors.New("shipping address country is required")
	}
	if s.ShippingAddress.ZipCode == "" {
		return errors.New("shipping address zip code is required")
	}
	return nil
}

func (s *Shipping) SelectShippingCost(total float64) {
	freeShippingLimit, _ := strconv.Atoi(os.Getenv("FREE_SHIPPING_LIMIT"))
	standardOutCordoba, _ := strconv.Atoi(os.Getenv("STANDARD_VALUE_OUT_OF_CORDOBA"))
	standardInCordoba, _ := strconv.Atoi(os.Getenv("STANDARD_VALUE_IN_CORDOBA"))

	if total >= float64(freeShippingLimit) {
		s.ShippingCost = 0.0
		return
	}
	if s.ShippingMethod == ShippingWhatsapp {
		s.ShippingCost = float64(standardInCordoba)
	} else {
		s.ShippingCost = float64(standardOutCordoba)
	}
}

/*
type Quotation struct {
	ZipCodeDestination string `json:"zip_code_destination"`
	Weight             string `json:"weight"`
	Dimensions         string `json:"dimensions"`
	DeclaredValue      string `json:"declared_value"`
}

type Bulto struct {
	Kilos          float64 `json:"kilos"`
	LargoCm        int     `json:"largoCm"`
	AltoCm         int     `json:"altoCm"`
	AnchoCm        int     `json:"anchoCm"`
	VolumenCm      int     `json:"volumenCm"`
	ValorDeclarado float64 `json:"valorDeclarado"` // Requerido para el seguro
}

type QuotationRequest struct {
	ZipCodeOrigen      string `json:"zip_code_origen"`
	ZipCodeDestination string `json:"zip_code_destino"`
	ContractNumber     string `json:"contract_number"`
	Weight             string `json:"weight"`
	Dimensions         string `json:"dimensions"`
	DeclaredValue      string `json:"declared_value"`
}

type QuotationResponse struct {
	ShipCost string `json:"ship_cost"`
}

type OrderRequest struct {
	Contrato string `json:"contrato"`
	Origen   struct {
		Postal AddressShipment `json:"postal"`
	} `json:"origen"`
	Destino struct {
		Postal AddressShipment `json:"postal"`
	} `json:"destino"`
	Remitente    UserInfo `json:"remitente"`
	Destinatario UserInfo `json:"destinatario"`
	Bultos       []Bulto  `json:"bultos"`
}

type OrderResponse struct {
	AgrupadorDeBultos     string `json:"agrupadorDeBultos"`
	Estado                string `json:"estado"`
	EtiquetasPorAgrupador string `json:"etiquetasPorAgrupador"`
}
*/
