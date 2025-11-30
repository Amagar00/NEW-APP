// js/utils.js
const Utils = {
    // Calculate Grade
    getGrade: (score) => {
        const settings = DB.read('settings');
        // Default grading if not set
        const grades = settings.grading.length ? settings.grading : [
            { min: 70, max: 100, grade: 'A', remark: 'Excellent' },
            { min: 60, max: 69, grade: 'B', remark: 'Very Good' },
            { min: 50, max: 59, grade: 'C', remark: 'Good' },
            { min: 45, max: 49, grade: 'D', remark: 'Fair' },
            { min: 40, max: 44, grade: 'E', remark: 'Pass' },
            { min: 0, max: 39, grade: 'F', remark: 'Fail' }
        ];

        const s = parseFloat(score);
        const g = grades.find(r => s >= r.min && s <= r.max);
        return g ? g : { grade: '?', remark: 'N/A' };
    },

    // Convert Image to Base64 (for student passport)
    fileToBase64: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
};

// js/resultsEngine.js
const ResultsEngine = {
    // Calculate Class Positions
    calculatePositions: (className, term) => {
        const allResults = DB.read('results');
        
        // 1. Filter by class and term
        let classResults = allResults.filter(r => r.className === className && r.term === term);

        if(classResults.length === 0) return [];

        // 2. Calculate Totals
        classResults = classResults.map(studentResult => {
            let total = 0;
            let count = 0;
            Object.values(studentResult.scores).forEach(scoreObj => {
                total += (parseFloat(scoreObj.total) || 0);
                count++;
            });
            studentResult.grandTotal = total;
            studentResult.average = count > 0 ? (total / count).toFixed(2) : 0;
            return studentResult;
        });

        // 3. Sort by Grand Total (Descending)
        classResults.sort((a, b) => b.grandTotal - a.grandTotal);

        // 4. Assign Positions (Handling Ties)
        let position = 1;
        for (let i = 0; i < classResults.length; i++) {
            if (i > 0 && classResults[i].grandTotal === classResults[i - 1].grandTotal) {
                classResults[i].position = classResults[i - 1].position; // Tie
            } else {
                classResults[i].position = i + 1;
            }
            
            // Update in DB
            DB.update('results', classResults[i].id, { 
                grandTotal: classResults[i].grandTotal,
                average: classResults[i].average,
                position: Utils.ordinal(classResults[i].position) 
            });
        }

        return classResults;
    }
};

// Helper for ordinal (1st, 2nd)
Utils.ordinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
