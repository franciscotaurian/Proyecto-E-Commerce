import { VALIDATION } from './constants.js';

// Email validation
export const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};

// Password validation
export const isValidPassword = (password) => {
    return password && password.length >= VALIDATION.MIN_PASSWORD_LENGTH;
};

// Phone validation (basic)
export const isValidPhone = (phone) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phone && phone.length >= 8 && phoneRegex.test(phone);
};

// DNI validation (Argentina)
export const isValidDNI = (dni) => {
    const dniRegex = /^\d{7,8}$/;
    return dniRegex.test(dni);
};

// General required field validation
export const isRequired = (value) => {
    return value !== null && value !== undefined && value.toString().trim() !== '';
};

// Validate form field
export const validateField = (name, value, rules = {}) => {
    const errors = [];

    if (rules.required && !isRequired(value)) {
        errors.push(`${name} is required`);
    }

    if (rules.email && value && !isValidEmail(value)) {
        errors.push(`Invalid email format`);
    }

    if (rules.password && value && !isValidPassword(value)) {
        errors.push(`Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`);
    }

    if (rules.phone && value && !isValidPhone(value)) {
        errors.push(`Invalid phone format`);
    }

    if (rules.dni && value && !isValidDNI(value)) {
        errors.push(`Invalid DNI format`);
    }

    if (rules.minLength && value && value.length < rules.minLength) {
        errors.push(`Minimum length is ${rules.minLength} characters`);
    }

    if (rules.maxLength && value && value.length > rules.maxLength) {
        errors.push(`Maximum length is ${rules.maxLength} characters`);
    }

    if (rules.min && value < rules.min) {
        errors.push(`Minimum value is ${rules.min}`);
    }

    if (rules.max && value > rules.max) {
        errors.push(`Maximum value is ${rules.max}`);
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Validate entire form
export const validateForm = (formData, validationRules) => {
    const errors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((field) => {
        const result = validateField(field, formData[field], validationRules[field]);
        if (!result.isValid) {
            errors[field] = result.errors;
            isValid = false;
        }
    });

    return {
        isValid,
        errors,
    };
};

export default {
    isValidEmail,
    isValidPassword,
    isValidPhone,
    isValidDNI,
    isRequired,
    validateField,
    validateForm,
};
