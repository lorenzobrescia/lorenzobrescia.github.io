/**
 * BibTeX Publications Parser
 * Automatically loads and displays publications from extras/pub.bib
 */

class BibtexParser {
    constructor() {
        this.publications = [];
        this.activeFilters = new Set(); // Track active filters
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
        const entries = content.split('@').filter(entry => entry.trim());

        entries.forEach(entry => {
            const pub = this.parseEntry(entry);
            if (pub) {
                publications.push(pub);
            }
        });

        // Sort by year (newest first)
        return publications.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
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

            // Parse fields with improved handling of braces and multi-line values
            const fieldMatches = entry.matchAll(/(\w+)\s*=\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}(?:,\s*)?/gs);
            
            for (const match of fieldMatches) {
                const [, field, value] = match;
                pub[field.toLowerCase()] = this.cleanField(value);
            }

            return pub;
        } catch (error) {
            console.error('Error parsing entry:', error);
            return null;
        }
    }

    /**
     * Clean and format field content, preserving text in braces
     */
    cleanField(text) {
        return text
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    /**
     * Format authors for display with Lorenzo Brescia in bold
     */
    formatAuthors(authors) {
        if (!authors) return '';
        
        return authors
            .split(' and ')
            .map(author => {
                const cleanAuthor = author.trim();
                // Check if this is Lorenzo Brescia and make it bold
                if (cleanAuthor === 'Lorenzo Brescia') {
                    return '<strong>Lorenzo Brescia</strong>';
                }
                return cleanAuthor;
            })
            .join(', ');
    }

    /**
     * Get publication type icon and description
     */
    getTypeInfo(type) {
        const typeMap = {
            'inproceedings': { icon: 'fas fa-users', desc: 'Conference/Workshop Paper' },
            'article': { icon: 'fas fa-file-alt', desc: 'Journal Article' },
            'book': { icon: 'fas fa-book', desc: 'Book' },
            'incollection': { icon: 'fas fa-book-open', desc: 'Book Chapter' },
            'techreport': { icon: 'fas fa-clipboard', desc: 'Technical Report' },
            'misc': { icon: 'fas fa-file', desc: 'Miscellaneous' }
        };
        return typeMap[type] || { icon: 'fas fa-file', desc: 'Publication' };
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

        // Create helper section
        const helper = this.createHelper();
        
        // Create publications list
        const publicationsList = document.createElement('div');
        publicationsList.className = 'publications-list mt-4';

        if (this.publications.length === 0) {
            publicationsList.innerHTML = '<p class="text-muted">No publications found.</p>';
        } else {
            const visiblePublications = this.getVisiblePublications();
            if (visiblePublications.length === 0) {
                publicationsList.innerHTML = '<p class="text-muted">No publications match the selected filters.</p>';
            } else {
                visiblePublications.forEach(pub => {
                    const pubElement = this.createPublicationElement(pub);
                    publicationsList.appendChild(pubElement);
                });
            }
        }

        // Replace existing content properly
        const existingHelper = container.querySelector('.publication-types-helper');
        const existingList = container.querySelector('.publications-list');
        
        if (existingHelper) {
            container.removeChild(existingHelper);
        }
        if (existingList) {
            container.removeChild(existingList);
        }
        
        container.appendChild(helper);
        container.appendChild(publicationsList);
    }

    /**
     * Create helper section explaining publication types
     */
    createHelper() {
        const helper = document.createElement('div');
        helper.className = 'publication-types-helper mb-4 p-3 bg-white rounded-3 shadow-sm border';
        
        // Get unique publication types from actual publications
        const existingTypes = [...new Set(this.publications.map(pub => pub.type))];
        
        // Filter types to only show those that exist in publications
        const allTypes = [
            { type: 'inproceedings', desc: 'Conference/Workshop Papers' },
            { type: 'article', desc: 'Journal Articles' },
            { type: 'book', desc: 'Books' },
            { type: 'incollection', desc: 'Book Chapters' },
            { type: 'techreport', desc: 'Technical Reports' },
            { type: 'misc', desc: 'Miscellaneous' }
        ];
        
        const typesToShow = allTypes.filter(({ type }) => existingTypes.includes(type));

        if (typesToShow.length === 0) {
            return helper; // Return empty helper if no publications
        }

        const headerDiv = document.createElement('div');
        headerDiv.className = 'mb-3';
        headerDiv.innerHTML = '<h6 class="mb-0 text-secondary">Legend (click to filter)</h6>';
        helper.appendChild(headerDiv);

        const badgesContainer = document.createElement('div');
        badgesContainer.className = 'd-flex flex-wrap gap-2 justify-content-center';
        
        typesToShow.forEach(({ type, desc }) => {
            const typeInfo = this.getTypeInfo(type);
            const isActive = this.activeFilters.has(type);
            
            const badge = document.createElement('span');
            badge.className = `badge filter-badge ${isActive ? 'bg-primary' : 'bg-secondary'}`;
            badge.style.cssText = `cursor: pointer; transition: all 0.3s ease; ${isActive ? '' : 'opacity: 0.7;'}`;
            badge.setAttribute('data-type', type);
            badge.innerHTML = `<i class="${typeInfo.icon} me-1"></i>${desc}`;
            
            // Add click event listener
            badge.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Badge clicked:', type); // Debug log
                this.toggleFilter(type);
            });
            
            // Add hover effects
            badge.addEventListener('mouseenter', () => {
                badge.style.opacity = '1';
            });
            badge.addEventListener('mouseleave', () => {
                if (!this.activeFilters.has(type)) {
                    badge.style.opacity = '0.7';
                }
            });
            
            badgesContainer.appendChild(badge);
        });
        
        helper.appendChild(badgesContainer);
        
        // Add count display
        const totalCount = this.publications.length;
        const visibleCount = this.getVisiblePublications().length;
        const countDiv = document.createElement('div');
        countDiv.className = 'text-center mt-3';
        countDiv.innerHTML = `
            <small class="text-muted">
                Showing ${visibleCount} of ${totalCount} publications
            </small>
        `;
        helper.appendChild(countDiv);
        
        return helper;
    }

    /**
     * Create HTML element for a single publication
     */
    createPublicationElement(pub) {
        const pubDiv = document.createElement('div');
        pubDiv.className = 'publication-item border-bottom pb-3 mb-3';

        const typeInfo = this.getTypeInfo(pub.type);
        const title = pub.title || 'Untitled';
        const authors = this.formatAuthors(pub.author);
        const venue = pub.booktitle || pub.journal || '';
        const year = pub.year || '';
        const url = pub.url || '';

        pubDiv.innerHTML = `
            <div class="d-flex align-items-start">
                <div class="flex-grow-1">
                    <div class="publication-title mb-1">
                        <i class="${typeInfo.icon} text-primary me-2"></i>
                        ${url ? `<a href="${url}" target="_blank" class="text-decoration-none fw-bold">${title}</a>` : `<span class="fw-bold">${title}</span>`}
                    </div>
                    ${authors ? `<div class="publication-authors text-muted small mb-1">${authors}${year ? ` (${year})` : ''}</div>` : ''}
                    <div class="publication-meta small text-secondary">
                        ${venue ? `<span><i class="fas fa-map-marker-alt me-1"></i>${venue}</span>` : ''}
                    </div>
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
            errorDiv.className = 'alert alert-warning mt-4';
            errorDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle me-2"></i>
                Unable to load publications. Please check if the BibTeX file exists.
            `;
            container.appendChild(errorDiv);
        }
    }

    /**
     * Get publications that should be visible based on active filters
     */
    getVisiblePublications() {
        if (this.activeFilters.size === 0) {
            return this.publications; // Show all if no filters active
        }
        return this.publications.filter(pub => this.activeFilters.has(pub.type));
    }

    /**
     * Toggle filter for a publication type
     */
    toggleFilter(type) {
        console.log('Toggling filter for:', type); // Debug log
        console.log('Current filters:', Array.from(this.activeFilters)); // Debug log
        
        if (this.activeFilters.has(type)) {
            this.activeFilters.delete(type);
        } else {
            this.activeFilters.add(type);
        }
        
        console.log('New filters:', Array.from(this.activeFilters)); // Debug log
        this.renderPublications();
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const bibtexParser = new BibtexParser();
    bibtexParser.loadPublications();
});
