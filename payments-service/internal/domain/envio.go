package domain

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
