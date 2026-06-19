// Address Entity
export class Address {
    constructor(data = {}) {
        this.street = data.street || '';
        this.number = data.number || '';
        this.floor = data.floor || '';
        this.apartment = data.apartment || '';
        this.city = data.city || '';
        this.province = data.province || '';
        this.country = data.country || '';
        this.zipCode = data.zip_code || data.zipCode || '';
    }

    // Check if address is in Cordoba
    isInCordoba() {
        return this.city.toLowerCase().includes('cordoba') ||
            this.city.toLowerCase().includes('córdoba');
    }

    // Validate address
    validate() {
        const errors = [];

        if (!this.street || this.street.trim() === '') {
            errors.push('Street is required');
        }

        if (!this.number || this.number.trim() === '') {
            errors.push('Number is required');
        }

        if (!this.floor || this.floor.trim() === '') {
            errors.push('Floor is required');
        }

        if (!this.apartment || this.apartment.trim() === '') {
            errors.push('Apartment is required');
        }

        if (!this.city || this.city.trim() === '') {
            errors.push('City is required');
        }

        if (!this.province || this.province.trim() === '') {
            errors.push('Province is required');
        }

        if (!this.country || this.country.trim() === '') {
            errors.push('Country is required');
        }

        if (!this.zipCode || this.zipCode.trim() === '') {
            errors.push('Zip code is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Format address as string
    toString() {
        return `${this.street} ${this.number}, Floor ${this.floor}, Apt ${this.apartment}, ${this.city}, ${this.province} ${this.zipCode}, ${this.country}`;
    }
}

// User Entity
export class User {
    constructor(data = {}) {
        this.id = data.id || data._id || '';
        this.firstName = data.first_name || data.firstName || '';
        this.lastName = data.last_name || data.lastName || '';
        this.dni = data.dni || '';
        this.email = data.email || '';
        this.phone = data.phone || '';
        this.address = new Address(data.address || data);
        this.isAdmin = data.is_admin || data.isAdmin || false;
        this.isVerified = data.is_verified || data.isVerified || false;
        this.createdAt = data.created_at || data.createdAt;
    }

    // Get full name
    getFullName() {
        return `${this.firstName} ${this.lastName}`.trim();
    }

    // Validate user data
    validate() {
        const errors = [];

        if (!this.firstName || this.firstName.trim() === '') {
            errors.push('First name is required');
        }

        if (!this.lastName || this.lastName.trim() === '') {
            errors.push('Last name is required');
        }

        if (!this.dni || this.dni.trim() === '') {
            errors.push('DNI is required');
        }

        if (!this.email || this.email.trim() === '') {
            errors.push('Email is required');
        } else if (!this.isValidEmail(this.email)) {
            errors.push('Invalid email format');
        }

        if (!this.phone || this.phone.trim() === '') {
            errors.push('Phone is required');
        }

        const addressValidation = this.address.validate();
        if (!addressValidation.isValid) {
            errors.push(...addressValidation.errors.map(e => `Address: ${e}`));
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }
}

export default User;
