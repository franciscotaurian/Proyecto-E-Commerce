// Category Entity
export class Category {
    constructor(data = {}) {
        this.id = data.id || data._id || '';
        this.name = data.name || '';
        this.image = data.image || '';
        this.createdAt = data.created_at || data.createdAt;
        this.updatedAt = data.updated_at || data.updatedAt;
    }

    // Validate category data
    validate() {
        const errors = [];

        if (!this.name || this.name.trim() === '') {
            errors.push('Category name is required');
        }

        if (!this.image || this.image.trim() === '') {
            errors.push('Category image is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

export default Category;
