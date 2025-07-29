/**
 * CSV Teaching Activities Parser
 * Automatically loads and displays teaching activities from extras/courses.csv
 */

class TeachingParser {
    constructor() {
        this.activities = [];
    }

    /**
     * Load and parse the CSV file
     */
    async loadTeachingActivities() {
        try {
            const response = await fetch('extras/courses.csv');
            const csvContent = await response.text();
            this.activities = this.parseCSV(csvContent);
            this.renderTeachingActivities();
        } catch (error) {
            console.error('Error loading teaching activities:', error);
            this.renderError();
        }
    }

    /**
     * Parse CSV content into structured data
     */
    parseCSV(content) {
        const lines = content.trim().split('\n');
        if (lines.length < 2) return [];

        // Get headers from first line
        const headers = lines[0].split(',').map(header => header.trim());
        const activities = [];

        // Parse data lines
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length >= headers.length) {
                const activity = {};
                headers.forEach((header, index) => {
                    activity[header] = values[index] ? values[index].trim() : '';
                });
                activities.push(activity);
            }
        }

        // Sort by year (newest first)
        return activities.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
    }

    /**
     * Parse a single CSV line, handling quoted values
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current); // Add the last value
        return values;
    }



    /**
     * Format course type for display
     */
    formatCourseType(courseType) {
        if (!courseType) return '';
        // Clean up the course type text
        return courseType.replace(/"/g, '').trim();
    }

    /**
     * Render teaching activities to the DOM
     */
    renderTeachingActivities() {
        const container = document.getElementById('teaching');
        if (!container) {
            console.error('Teaching container not found');
            return;
        }

        // Create teaching activities list
        const activitiesList = document.createElement('div');
        activitiesList.className = 'teaching-list mt-4';

        if (this.activities.length === 0) {
            activitiesList.innerHTML = '<p class="text-muted">No teaching activities found.</p>';
        } else {
            this.activities.forEach(activity => {
                const activityElement = this.createActivityElement(activity);
                activitiesList.appendChild(activityElement);
            });
        }

        // Replace existing content
        const existingList = container.querySelector('.teaching-list') || container.querySelector('ul');
        if (existingList) {
            existingList.replaceWith(activitiesList);
        } else {
            container.appendChild(activitiesList);
        }
    }

    /**
     * Create HTML element for a single teaching activity
     */
    createActivityElement(activity) {
        const activityDiv = document.createElement('div');
        activityDiv.className = 'teaching-item border-bottom pb-3 mb-3';

        const courseName = activity.course_name || 'Untitled Course';
        const role = activity.role || '';
        const year = activity.year || '';
        const place = activity.place || '';
        const courseType = this.formatCourseType(activity.course_type);
        const url = activity.url || '';
        const description = activity.description || '';

        activityDiv.innerHTML = `
            <div class="d-flex align-items-start">
                <div class="flex-grow-1">
                    <div class="teaching-title mb-1">
                        ${url ? `<a href="${url}" target="_blank" class="text-decoration-none fw-bold">${courseName}</a>` : `<span class="fw-bold">${courseName}</span>`}
                    </div>
                    <div class="teaching-role text-muted small mb-1">
                        ${role}${year ? ` (${year})` : ''}
                    </div>
                    <div class="teaching-meta small text-secondary">
                        ${place ? `<span class="me-3"><i class="fas fa-map-marker-alt me-1"></i>${place}</span>` : ''}
                        ${courseType ? `<span><i class="fas fa-graduation-cap me-1"></i>${courseType}</span>` : ''}
                    </div>
                    ${description ? `<div class="teaching-description small text-muted mt-2">${description}</div>` : ''}
                </div>
            </div>
        `;

        return activityDiv;
    }

    /**
     * Render error message
     */
    renderError() {
        const container = document.getElementById('teaching');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-warning mt-4';
            errorDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle me-2"></i>
                Unable to load teaching activities. Please check if the CSV file exists.
            `;
            container.appendChild(errorDiv);
        }
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const parser = new TeachingParser();
    parser.loadTeachingActivities();
});
