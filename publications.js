/**
 * BibTeX Publications Parser
 * Automatically loads and displays publications from extras/pub.bib
 */

class BibtexParser {
    constructor() {
        this.publications = [];
    }

    /**
     * Load and parse the BibTeX file
     */
    async loadPublications() {
        try {
            const response = await fetch('extras/pub.bib');
            const bibtexContent = await response.text();
            this.publications = this.parseBibtex(bibtexContent);
            this.renderPublications();
        } catch (error) {
            console.error('Error loading publications:', error);
            this.renderError();
        }
    }

    /**
     * Parse BibTeX content into structured data
     */
    parseBibtex(content) {
        const publications = [];
        // Split by @ to find entries
        const entries = content.split('@').filter(entry => entry.trim());

        entries.forEach(entry => {
            const pub = this.parseEntry(entry);
            if (pub) {
                publications.push(pub);
            }
        });

        // Sort by year (newest first)
        return publications.sort((a, b) => (b.year || 0) - (a.year || 0));
    }

    /**
     * Parse individual BibTeX entry
     */
    parseEntry(entry) {
        try {
            // Extract entry type and key
            const firstLine = entry.split('\n')[0];
            const typeMatch = firstLine.match(/^(\w+)\{([^,]+),?/);
            if (!typeMatch) return null;

            const [, type, key] = typeMatch;
            const pub = { type: type.toLowerCase(), key };

            // Parse fields
            const fieldRegex = /(\w+)\s*=\s*\{([^}]+)\}/g;
            let match;
            
            while ((match = fieldRegex.exec(entry)) !== null) {
                const [, field, value] = match;
                pub[field.toLowerCase()] = value.trim();
            }

            // Handle multi-line values and nested braces
            const multiLineFields = ['abstract', 'title'];
            multiLineFields.forEach(field => {
                if (pub[field]) {
                    pub[field] = this.cleanField(pub[field]);
                }
            });

            return pub;
        } catch (error) {
            console.error('Error parsing entry:', error);
            return null;
        }
    }

    /**
     * Clean and format field content
     */
    cleanField(text) {
        return text
            .replace(/\\\w+\{([^}]+)\}/g, '$1') // Remove LaTeX commands like \textsuperscript{}
            .replace(/\{([^}]+)\}/g, '$1') // Remove remaining braces
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    /**
     * Format authors for display
     */
    formatAuthors(authors) {
        if (!authors) return '';
        return authors
            .split(' and ')
            .map(author => {
                // Handle "Last, First" format
                if (author.includes(',')) {
                    const [last, first] = author.split(',').map(s => s.trim());
                    return `${first} ${last}`;
                }
                return author.trim();
            })
            .join(', ');
    }

    /**
     * Get publication type icon
     */
    getTypeIcon(type) {
        const icons = {
            'inproceedings': 'fas fa-file-alt',
            'article': 'fas fa-newspaper',
            'book': 'fas fa-book',
            'incollection': 'fas fa-book-open',
            'techreport': 'fas fa-file-contract',
            'misc': 'fas fa-file'
        };
        return icons[type] || 'fas fa-file';
    }

    /**
     * Render publications to the DOM
     */
    renderPublications() {
        const container = document.getElementById('publications');
        if (!container) {
            console.error('Publications container not found');
            return;
        }

        // Create publications list
        const publicationsList = document.createElement('div');
        publicationsList.className = 'publications-list';

        if (this.publications.length === 0) {
            publicationsList.innerHTML = '<p class="text-muted">No publications found.</p>';
        } else {
            this.publications.forEach(pub => {
                const pubElement = this.createPublicationElement(pub);
                publicationsList.appendChild(pubElement);
            });
        }

        // Replace existing content
        const existingList = container.querySelector('.publications-list') || container.querySelector('ul');
        if (existingList) {
            existingList.replaceWith(publicationsList);
        } else {
            container.appendChild(publicationsList);
        }
    }

    /**
     * Create HTML element for a single publication
     */
    createPublicationElement(pub) {
        const pubDiv = document.createElement('div');
        pubDiv.className = 'publication-item mb-4 p-3 border rounded';

        const title = pub.title || 'Untitled';
        const authors = this.formatAuthors(pub.author);
        const year = pub.year || '';
        const venue = pub.booktitle || pub.journal || '';
        const url = pub.url || pub['bdsk-url-1'] || '';
        const doi = pub.doi || '';

        pubDiv.innerHTML = `
            <div class="d-flex align-items-start">
                <i class="${this.getTypeIcon(pub.type)} text-primary me-3 mt-1"></i>
                <div class="flex-grow-1">
                    <h5 class="mb-2">
                        ${url ? `<a href="${url}" target="_blank" class="text-decoration-none">${title}</a>` : title}
                    </h5>
                    ${authors ? `<p class="mb-1 text-muted"><strong>Authors:</strong> ${authors}</p>` : ''}
                    ${venue ? `<p class="mb-1 text-muted"><strong>Venue:</strong> ${venue}</p>` : ''}
                    ${year ? `<p class="mb-1 text-muted"><strong>Year:</strong> ${year}</p>` : ''}
                    ${pub.abstract ? `
                        <div class="mt-2">
                            <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="collapse" data-bs-target="#abstract-${pub.key}" aria-expanded="false">
                                Show Abstract
                            </button>
                            <div class="collapse mt-2" id="abstract-${pub.key}">
                                <div class="card card-body">
                                    <small>${pub.abstract}</small>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    ${doi || url ? `
                        <div class="mt-2">
                            ${doi ? `<a href="https://doi.org/${doi}" target="_blank" class="btn btn-sm btn-primary me-2">DOI</a>` : ''}
                            ${url ? `<a href="${url}" target="_blank" class="btn btn-sm btn-outline-primary">PDF</a>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        return pubDiv;
    }

    /**
     * Render error message
     */
    renderError() {
        const container = document.getElementById('publications');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-warning';
            errorDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle me-2"></i>
                Unable to load publications. Please check if the BibTeX file exists.
            `;
            container.appendChild(errorDiv);
        }
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const parser = new BibtexParser();
    parser.loadPublications();
});
