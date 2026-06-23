package client

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type UserClient struct {
	baseURL string
	client  *http.Client
}

type Address struct {
	Street    string `bson:"street" json:"street"`
	Number    string `bson:"number" json:"number"`
	Floor     string `bson:"floor" json:"floor"`
	Apartment string `bson:"apartment" json:"apartment"`
	City      string `bson:"city" json:"city"`
	State     string `bson:"state" json:"state"`
	Country   string `bson:"country" json:"country"`
	ZipCode   string `bson:"zip_code" json:"zip_code"`
}

type userInfo struct {
	FirstName string  `json:"first_name"`
	LastName  string  `json:"last_name"`
	DNI       string  `json:"dni"`
	Email     string  `json:"email"`
	Phone     string  `json:"phone"`
	Address   Address `json:"address"`
}

func NewUserClient(baseURL string) *UserClient {
	return &UserClient{
		baseURL: baseURL,
		client:  &http.Client{},
	}
}

func (c *UserClient) GetUserInfo(userID string) (*userInfo, error) {

	resp, err := c.client.Get(c.baseURL + "/internal/user_information/" + userID)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var userInfo userInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, err
	}

	return &userInfo, nil
}

func (c *UserClient) IsVerifiedUser(userID string) (bool, error) {
	resp, err := c.client.Get(c.baseURL + "/internal/is-verified/" + userID)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var response struct {
		IsVerified bool `json:"isVerified"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return false, err
	}

	return response.IsVerified, nil
}
