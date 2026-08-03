document.addEventListener("DOMContentLoaded", () => {
    let currentOp = 1;
    let matrixData = {
        A: [[1, 2], [3, 4]],
        B: [[5, 6], [7, 8]]
    };
    let scalarVal = 2.0;
    let powerVal = 2;
    let identityN = 3;
    let vectorB = [1, 2];
    let matrixCount = 2;

    // DOM Elements
    const visitorCountEl = document.getElementById("visitorCount");
    const opButtons = document.querySelectorAll(".op-btn");

    // Initialize Visitor Counter (Local Storage + Online Counter API)
    function initVisitorCounter() {
        let visits = parseInt(localStorage.getItem("matrix_studio_visits") || "0", 10) + 1;
        localStorage.setItem("matrix_studio_visits", visits);
        
        // Display local count first
        visitorCountEl.textContent = `Visits: ${visits}`;

        // Attempt online count API sync (non-blocking fallback)
        fetch("https://api.counterapi.dev/v1/matrix-studio-app-sibanand/visits/up")
            .then(res => res.json())
            .then(data => {
                if (data && data.count) {
                    visitorCountEl.textContent = `Visits: ${data.count}`;
                }
            })
            .catch(() => {
                // Silently keep local storage count if offline
            });
    }

    initVisitorCounter();
    const currentOpTitle = document.getElementById("currentOpTitle");
    const opDescription = document.getElementById("opDescription");
    const opBadge = document.getElementById("opBadge");
    const paramRow = document.getElementById("paramRow");
    const matricesInputGrid = document.getElementById("matricesInputGrid");
    const computeBtn = document.getElementById("computeBtn");
    const fillRandomBtn = document.getElementById("fillRandomBtn");
    const resetInputsBtn = document.getElementById("resetInputsBtn");
    const resultCard = document.getElementById("resultCard");
    const resultContent = document.getElementById("resultContent");
    const resultStepsContent = document.getElementById("resultStepsContent");
    const useResultAsInputBtn = document.getElementById("useResultAsInputBtn");
    const copyResultTextBtn = document.getElementById("copyResultTextBtn");
    const copyLatexBtn = document.getElementById("copyLatexBtn");
    const memoryBadge = document.getElementById("memoryBadge");
    const memoryText = document.getElementById("memoryText");
    const clearMemoryBtn = document.getElementById("clearMemoryBtn");
    const presetSelect = document.getElementById("presetSelect");
    const tabOutputBtn = document.getElementById("tabOutputBtn");
    const tabStepsBtn = document.getElementById("tabStepsBtn");

    let lastComputedResultMat = null;
    let lastComputedLatex = "";

    // Operation Configuration metadata
    const opConfigs = {
        1: { title: "1. Add Matrices", desc: "Computes element-wise sum of matrices.", badge: "Matching Dimensions", numMatrices: 2, allowMulti: true },
        2: { title: "2. Multiply Matrices", desc: "Computes matrix product A × B × ...", badge: "Cols(A) = Rows(B)", numMatrices: 2, allowMulti: true },
        3: { title: "3. Transpose Matrix", desc: "Swaps rows and columns (Aᵀ).", badge: "Single Matrix", numMatrices: 1 },
        4: { title: "4. Subtract Matrices", desc: "Computes element-wise difference.", badge: "Matching Dimensions", numMatrices: 2, allowMulti: true },
        5: { title: "5. Scalar Multiplication", desc: "Multiplies every element by a scalar k.", badge: "Single Matrix + Scalar k", numMatrices: 1, hasScalar: true },
        6: { title: "6. Identity Matrix Generator", desc: "Generates square identity matrix I_n.", badge: "n × n Matrix", numMatrices: 0, hasIdentityN: true },
        7: { title: "7. Compare Matrices", desc: "Checks element-wise equality within 1e-9.", badge: "Matching Dimensions", numMatrices: 2, allowMulti: true },
        8: { title: "8. Determinant", desc: "Calculates matrix determinant det(A).", badge: "Square Matrix (n × n)", numMatrices: 1, squareOnly: true },
        9: { title: "9. Inverse Matrix", badge: "Square Non-Singular", desc: "Calculates inverse matrix A⁻¹ such that A × A⁻¹ = I.", numMatrices: 1, squareOnly: true },
        10: { title: "10. Matrix Rank", desc: "Finds maximum linearly independent rows/cols.", badge: "Row-Echelon Rank", numMatrices: 1 },
        11: { title: "11. Trace", desc: "Sum of main diagonal elements tr(A).", badge: "Square Matrix (n × n)", numMatrices: 1, squareOnly: true },
        12: { title: "12. Adjoint Matrix", desc: "Transpose of cofactor matrix adj(A).", badge: "Square Matrix (n × n)", numMatrices: 1, squareOnly: true },
        13: { title: "13. Cofactor Matrix", desc: "Matrix of signed minor determinants.", badge: "Square Matrix (n × n)", numMatrices: 1, squareOnly: true },
        14: { title: "14. Gaussian Elimination", desc: "Reduces matrix to Row-Echelon Form (RREF).", badge: "Row Reduction", numMatrices: 1 },
        15: { title: "15. LU Decomposition", desc: "Decomposes A into Lower & Upper triangular (A = L × U).", badge: "Doolittle Factorization", numMatrices: 1, squareOnly: true },
        16: { title: "16. Matrix Exponentiation", desc: "Fast binary exponentiation A^p.", badge: "Square Matrix ^ Power p", numMatrices: 1, squareOnly: true, hasPower: true },
        17: { title: "17. Solve System Ax = b", desc: "Solves linear equation system Ax = b.", badge: "Square Matrix A & Vector b", numMatrices: 1, squareOnly: true, hasVectorB: true },
        18: { title: "18. Eigenvalues (2x2 / 3x3)", desc: "Calculates roots of characteristic polynomial det(A - λI) = 0.", badge: "2×2 or 3×3 Square Matrix", numMatrices: 1, eigenOnly: true }
    };

    // Sidebar buttons
    opButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            opButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentOp = parseInt(btn.dataset.op, 10);
            renderWorkspace();
        });
    });

    // Preset Loader
    presetSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        if (val === "rotation") {
            const rad = Math.PI / 4; // 45 degrees
            matrixData.A = [
                [parseFloat(Math.cos(rad).toFixed(4)), parseFloat(-Math.sin(rad).toFixed(4))],
                [parseFloat(Math.sin(rad).toFixed(4)), parseFloat(Math.cos(rad).toFixed(4))]
            ];
            currentOp = 3; // Transpose / Inverse demo
        } else if (val === "hilbert") {
            matrixData.A = [
                [1.0, 0.5, 0.333],
                [0.5, 0.333, 0.25],
                [0.333, 0.25, 0.2]
            ];
            currentOp = 8; // Determinant
        } else if (val === "system") {
            matrixData.A = [
                [2, 1, -1],
                [-3, -1, 2],
                [-2, 1, 2]
            ];
            vectorB = [8, -11, -3];
            currentOp = 17; // Solve Ax = b
        } else if (val === "singular") {
            matrixData.A = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ];
            currentOp = 9; // Inverse
        } else if (val === "identity3") {
            matrixData.A = identityMatrix(3);
            currentOp = 16;
            powerVal = 5;
        } else if (val === "eigen2") {
            matrixData.A = [
                [4, -2],
                [1,  1]
            ];
            currentOp = 18;
        } else if (val === "eigen3") {
            matrixData.A = [
                [2, -1, 0],
                [-1, 2, -1],
                [0, -1, 2]
            ];
            currentOp = 18;
        }

        // Activate matching sidebar button
        opButtons.forEach(b => {
            if (parseInt(b.dataset.op, 10) === currentOp) b.classList.add("active");
            else b.classList.remove("active");
        });

        renderWorkspace();
        presetSelect.selectedIndex = 0;
    });

    // Tab switching
    tabOutputBtn.addEventListener("click", () => {
        tabOutputBtn.classList.add("active");
        tabStepsBtn.classList.remove("active");
        resultContent.style.display = "block";
        resultStepsContent.style.display = "none";
    });

    tabStepsBtn.addEventListener("click", () => {
        tabStepsBtn.classList.add("active");
        tabOutputBtn.classList.remove("active");
        resultContent.style.display = "none";
        resultStepsContent.style.display = "block";
    });

    function updateMemoryBadge() {
        const lastRes = getLastResult();
        if (lastRes.hasResult) {
            memoryBadge.classList.add("active");
            memoryText.textContent = `Memory: (${lastRes.rows}×${lastRes.cols})`;
            clearMemoryBtn.style.display = "inline-block";
        } else {
            memoryBadge.classList.remove("active");
            memoryText.textContent = "Memory Empty";
            clearMemoryBtn.style.display = "none";
        }
    }

    clearMemoryBtn.addEventListener("click", () => {
        saveLastResult([[]]);
        lastResultState.hasResult = false;
        updateMemoryBadge();
        renderWorkspace();
    });

    function renderWorkspace() {
        const cfg = opConfigs[currentOp];
        currentOpTitle.textContent = cfg.title;
        opDescription.textContent = cfg.desc;
        opBadge.textContent = cfg.badge;

        // Render Parameters Row
        paramRow.innerHTML = "";
        let showParamRow = false;

        if (cfg.hasScalar) {
            showParamRow = true;
            paramRow.innerHTML += `
                <div class="param-group">
                    <label>Scalar Value (k):</label>
                    <input type="number" id="scalarInput" value="${scalarVal}" step="any" style="width:90px;">
                </div>
            `;
        }

        if (cfg.hasPower) {
            showParamRow = true;
            paramRow.innerHTML += `
                <div class="param-group">
                    <label>Power (p ≥ 0):</label>
                    <input type="number" id="powerInput" value="${powerVal}" min="0" step="1" style="width:80px;">
                </div>
            `;
        }

        if (cfg.hasIdentityN) {
            showParamRow = true;
            paramRow.innerHTML += `
                <div class="param-group">
                    <label>Dimension (n × n):</label>
                    <input type="number" id="identityNInput" value="${identityN}" min="1" max="10" step="1" style="width:80px;">
                </div>
            `;
        }

        if (cfg.allowMulti) {
            showParamRow = true;
            paramRow.innerHTML += `
                <div class="param-group">
                    <label>Number of Matrices:</label>
                    <select id="matrixCountSelect">
                        <option value="2" ${matrixCount === 2 ? 'selected' : ''}>2 Matrices</option>
                        <option value="3" ${matrixCount === 3 ? 'selected' : ''}>3 Matrices</option>
                        <option value="4" ${matrixCount === 4 ? 'selected' : ''}>4 Matrices</option>
                    </select>
                </div>
            `;
        }

        if (cfg.hasVectorB) {
            showParamRow = true;
            paramRow.innerHTML += `
                <div class="param-group">
                    <label>Vector b (${matrixData.A.length} values):</label>
                    <input type="text" id="vectorBInput" value="${vectorB.join(', ')}" placeholder="e.g. 8, -11, -3" style="width:220px;">
                </div>
            `;
        }

        paramRow.style.display = showParamRow ? "flex" : "none";

        // Bind parameter listeners
        if (cfg.hasScalar) {
            document.getElementById("scalarInput").addEventListener("input", (e) => {
                scalarVal = parseFloat(e.target.value) || 0;
            });
        }

        if (cfg.hasPower) {
            document.getElementById("powerInput").addEventListener("input", (e) => {
                powerVal = parseInt(e.target.value, 10) || 0;
            });
        }

        if (cfg.hasIdentityN) {
            document.getElementById("identityNInput").addEventListener("input", (e) => {
                identityN = parseInt(e.target.value, 10) || 1;
            });
        }

        if (cfg.allowMulti) {
            document.getElementById("matrixCountSelect").addEventListener("change", (e) => {
                matrixCount = parseInt(e.target.value, 10);
                renderMatricesInputGrid();
            });
        }

        if (cfg.hasVectorB) {
            document.getElementById("vectorBInput").addEventListener("input", (e) => {
                vectorB = e.target.value.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
            });
        }

        renderMatricesInputGrid();
        updateMemoryBadge();
    }

    function renderMatricesInputGrid() {
        const cfg = opConfigs[currentOp];
        matricesInputGrid.innerHTML = "";

        if (cfg.hasIdentityN) {
            matricesInputGrid.innerHTML = `
                <div class="matrix-card" style="grid-column: 1 / -1; text-align: center;">
                    <p style="color: var(--text-muted);">Identity matrix will be created with dimension <strong>${identityN} × ${identityN}</strong> upon computation.</p>
                </div>
            `;
            return;
        }

        let numMats = cfg.numMatrices;
        if (cfg.allowMulti) {
            numMats = matrixCount;
        }

        const labels = ["A", "B", "C", "D"];
        for (let m = 0; m < numMats; m++) {
            const key = labels[m];
            if (!matrixData[key]) {
                matrixData[key] = [[1, 0], [0, 1]];
            }
            const mat = matrixData[key];
            const rows = mat.length;
            const cols = mat[0].length;

            const card = document.createElement("div");
            card.className = "matrix-card";

            let reuseBtnHtml = "";
            const lastRes = getLastResult();
            if (lastRes.hasResult && lastRes.rows === rows && lastRes.cols === cols) {
                reuseBtnHtml = `<button class="btn-sm btn-ghost reuse-btn" data-key="${key}">↪ Reuse Memory (${rows}×${cols})</button>`;
            }

            card.innerHTML = `
                <div class="matrix-card-header">
                    <span class="matrix-card-title">Matrix ${key}</span>
                    <div class="dim-controls">
                        <input type="number" class="dim-input rows-input" data-key="${key}" value="${rows}" min="1" max="10">
                        <span>×</span>
                        <input type="number" class="dim-input cols-input" data-key="${key}" value="${cols}" min="1" max="10">
                        ${reuseBtnHtml}
                    </div>
                </div>
                <div class="matrix-wrapper">
                    <div class="matrix-brackets">
                        <div class="matrix-grid-table" style="grid-template-columns: repeat(${cols}, 1fr);">
                            ${mat.map((row, r) => 
                                row.map((val, c) => 
                                    `<input type="number" step="any" class="matrix-cell" data-key="${key}" data-row="${r}" data-col="${c}" value="${val}">`
                                ).join('')
                            ).join('')}
                        </div>
                    </div>
                </div>
            `;
            matricesInputGrid.appendChild(card);
        }

        // Attach Cell Inputs & Keyboard Arrow Navigation
        const cells = document.querySelectorAll(".matrix-cell");
        cells.forEach(cell => {
            cell.addEventListener("input", (e) => {
                const key = e.target.dataset.key;
                const r = parseInt(e.target.dataset.row, 10);
                const c = parseInt(e.target.dataset.col, 10);
                const val = parseFloat(e.target.value) || 0.0;
                matrixData[key][r][c] = val;
            });

            cell.addEventListener("keydown", (e) => {
                const key = e.target.dataset.key;
                const r = parseInt(e.target.dataset.row, 10);
                const c = parseInt(e.target.dataset.col, 10);
                const maxR = matrixData[key].length - 1;
                const maxC = matrixData[key][0].length - 1;

                let nextCell = null;
                if (e.key === "ArrowRight") {
                    if (c < maxC) nextCell = document.querySelector(`.matrix-cell[data-key="${key}"][data-row="${r}"][data-col="${c+1}"]`);
                } else if (e.key === "ArrowLeft") {
                    if (c > 0) nextCell = document.querySelector(`.matrix-cell[data-key="${key}"][data-row="${r}"][data-col="${c-1}"]`);
                } else if (e.key === "ArrowDown" || e.key === "Enter") {
                    if (r < maxR) nextCell = document.querySelector(`.matrix-cell[data-key="${key}"][data-row="${r+1}"][data-col="${c}"]`);
                } else if (e.key === "ArrowUp") {
                    if (r > 0) nextCell = document.querySelector(`.matrix-cell[data-key="${key}"][data-row="${r-1}"][data-col="${c}"]`);
                }

                if (nextCell) {
                    e.preventDefault();
                    nextCell.focus();
                    nextCell.select();
                }
            });
        });

        // Dimensions inputs
        document.querySelectorAll(".rows-input, .cols-input").forEach(dimInput => {
            dimInput.addEventListener("change", (e) => {
                const key = e.target.dataset.key;
                const isSquare = cfg.squareOnly || cfg.eigenOnly;
                let newRows = parseInt(cardKeyInput(key, ".rows-input").value, 10) || 2;
                let newCols = parseInt(cardKeyInput(key, ".cols-input").value, 10) || 2;

                if (isSquare) {
                    newRows = Math.max(1, Math.min(10, newRows));
                    newCols = newRows;
                } else {
                    newRows = Math.max(1, Math.min(10, newRows));
                    newCols = Math.max(1, Math.min(10, newCols));
                }

                if (cfg.eigenOnly) {
                    if (newRows !== 2 && newRows !== 3) {
                        newRows = 2;
                        newCols = 2;
                    }
                }

                matrixData[key] = resizeMatrix(matrixData[key], newRows, newCols);
                renderWorkspace();
            });
        });

        // Reuse memory
        document.querySelectorAll(".reuse-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const key = e.target.dataset.key;
                const lastRes = getLastResult();
                if (lastRes.hasResult) {
                    matrixData[key] = copyMatrix(lastRes.matrix);
                    renderWorkspace();
                }
            });
        });
    }

    function cardKeyInput(key, selector) {
        return Array.from(document.querySelectorAll(selector)).find(el => el.dataset.key === key);
    }

    function resizeMatrix(mat, newRows, newCols) {
        const res = createMatrix(newRows, newCols, 0.0);
        for (let i = 0; i < Math.min(mat.length, newRows); i++) {
            for (let j = 0; j < Math.min(mat[0].length, newCols); j++) {
                res[i][j] = mat[i][j];
            }
        }
        return res;
    }

    // Random values
    fillRandomBtn.addEventListener("click", () => {
        Object.keys(matrixData).forEach(key => {
            const mat = matrixData[key];
            for (let i = 0; i < mat.length; i++) {
                for (let j = 0; j < mat[0].length; j++) {
                    mat[i][j] = Math.floor(Math.random() * 19) - 9;
                }
            }
        });
        renderWorkspace();
    });

    // Reset inputs
    resetInputsBtn.addEventListener("click", () => {
        Object.keys(matrixData).forEach(key => {
            const mat = matrixData[key];
            for (let i = 0; i < mat.length; i++) {
                for (let j = 0; j < mat[0].length; j++) {
                    mat[i][j] = 0;
                }
            }
        });
        renderWorkspace();
    });

    // Main Compute Handler
    computeBtn.addEventListener("click", () => {
        resultCard.style.display = "block";
        resultContent.innerHTML = "";
        resultStepsContent.innerHTML = "";
        lastComputedResultMat = null;
        lastComputedLatex = "";

        try {
            let stepsHtml = "";

            switch (currentOp) {
                case 1: { // Add
                    let res = copyMatrix(matrixData.A);
                    const labels = ["A", "B", "C", "D"];
                    for (let m = 1; m < matrixCount; m++) {
                        const key = labels[m];
                        res = addMatrices(res, matrixData[key]);
                    }
                    renderMatrixOutput(res, `Sum of ${matrixCount} Matrices`);
                    lastComputedResultMat = res;
                    lastComputedLatex = matrixToLatex(res);
                    stepsHtml = `<div class="step-card"><div class="step-title">Step 1: Element-wise addition</div>Summing each corresponding entry C[i,j] = A[i,j] + B[i,j].</div>`;
                    break;
                }

                case 2: { // Multiply
                    let res = copyMatrix(matrixData.A);
                    const labels = ["A", "B", "C", "D"];
                    for (let m = 1; m < matrixCount; m++) {
                        const key = labels[m];
                        res = multiplyMatrices(res, matrixData[key]);
                    }
                    renderMatrixOutput(res, `Product of ${matrixCount} Matrices`);
                    lastComputedResultMat = res;
                    lastComputedLatex = matrixToLatex(res);
                    stepsHtml = `<div class="step-card"><div class="step-title">Step 1: Matrix Product</div>Computing row-by-column dot product: C[i,j] = ∑ A[i,k] * B[k,j].</div>`;
                    break;
                }

                case 3: { // Transpose
                    const res = transposeMatrix(matrixData.A);
                    renderMatrixOutput(res, "Transposed Matrix (Aᵀ)");
                    lastComputedResultMat = res;
                    lastComputedLatex = matrixToLatex(res);
                    stepsHtml = `<div class="step-card"><div class="step-title">Step 1: Swap Indices</div>Original element A[i,j] moved to position Aᵀ[j,i].</div>`;
                    break;
                }

                case 4: { // Subtract
                    let res = copyMatrix(matrixData.A);
                    const labels = ["A", "B", "C", "D"];
                    for (let m = 1; m < matrixCount; m++) {
                        const key = labels[m];
                        res = subtractMatrices(res, matrixData[key]);
                    }
                    renderMatrixOutput(res, `Difference of ${matrixCount} Matrices`);
                    lastComputedResultMat = res;
                    lastComputedLatex = matrixToLatex(res);
                    stepsHtml = `<div class="step-card"><div class="step-title">Step 1: Element-wise subtraction</div>Subtracting corresponding entries: C[i,j] = A[i,j] - B[i,j].</div>`;
                    break;
                }

                case 5: { // Scalar Multiply
                    const res = scalarMultiply(matrixData.A, scalarVal);
                    renderMatrixOutput(res, `Scalar Result (${scalarVal} × A)`);
                    lastComputedResultMat = res;
                    lastComputedLatex = matrixToLatex(res);
                    stepsHtml = `<div class="step-card"><div class="step-title">Step 1: Scalar Multiplication</div>Multiplying every entry A[i,j] by ${scalarVal}.</div>`;
                    break;
                }

                case 6: { // Identity
                    const res = identityMatrix(identityN);
                    renderMatrixOutput(res, `Identity Matrix (I_${identityN})`);
                    lastComputedResultMat = res;
                    lastComputedLatex = matrixToLatex(res);
                    stepsHtml = `<div class="step-card"><div class="step-title">Step 1: Identity Matrix</div>Created ${identityN}×${identityN} matrix with 1 on diagonal and 0 elsewhere.</div>`;
                    break;
                }

                case 7: { // Compare
                    let allEqual = true;
                    const labels = ["A", "B", "C", "D"];
                    for (let m = 1; m < matrixCount; m++) {
                        const key = labels[m];
                        if (!compareMatrices(matrixData.A, matrixData[key])) {
                            allEqual = false;
                            break;
                        }
                    }
                    resultContent.innerHTML = `<div class="result-text-block" style="font-size: 1.1rem; color: ${allEqual ? 'var(--success)' : 'var(--danger)'};">
                        ${allEqual ? "✔ All specified matrices are EQUAL." : "✖ The matrices are NOT equal."}
                    </div>`;
                    stepsHtml = `<div class="step-card"><div class="step-title">Comparison Result</div>Comparing each entry within tolerance EPS = 1e-9.</div>`;
                    break;
                }

                case 8: { // Determinant
                    const det = determinant(matrixData.A);
                    resultContent.innerHTML = `<div class="result-text-block" style="font-size: 1.25rem; color: var(--primary);">
                        Determinant det(A) = <strong>${det.toFixed(4)}</strong>
                    </div>`;
                    lastComputedLatex = `\\det(A) = ${det.toFixed(4)}`;
                    
                    stepsHtml = `
                        <div class="step-card"><div class="step-title">Formula</div>For a square matrix A, det(A) is calculated using recursive Laplace minor expansion along the first row.</div>
                        <div class="step-card"><div class="step-title">Expansion</div>det(A) = ∑ (-1)^(1+j) * A[1,j] * det(M_{1,j})</div>
                        <div class="step-card"><div class="step-title">Final Answer</div>det(A) = ${det.toFixed(4)}</div>
                    `;
                    break;
                }

                case 9: { // Inverse
                    const det = determinant(matrixData.A);
                    const inv = inverseMatrix(matrixData.A);
                    if (inv) {
                        renderMatrixOutput(inv, "Inverse Matrix (A⁻¹)");
                        lastComputedResultMat = inv;
                        lastComputedLatex = `A^{-1} = ` + matrixToLatex(inv);
                        stepsHtml = `
                            <div class="step-card"><div class="step-title">Step 1: Check Determinant</div>det(A) = ${det.toFixed(4)} ≠ 0 (Matrix is non-singular).</div>
                            <div class="step-card"><div class="step-title">Step 2: Adjoint Matrix</div>Compute cofactor matrix cof(A) and transpose to find adj(A).</div>
                            <div class="step-card"><div class="step-title">Step 3: Formula A⁻¹ = (1 / det(A)) * adj(A)</div>Divide every element of adj(A) by ${det.toFixed(4)}.</div>
                        `;
                    } else {
                        resultContent.innerHTML = `<div class="result-text-block" style="color: var(--danger);">
                            Matrix is Singular (det(A) ≈ 0). Inverse does not exist.
                        </div>`;
                        stepsHtml = `<div class="step-card"><div class="step-title">Singular Matrix</div>det(A) = 0, division by zero is undefined.</div>`;
                    }
                    break;
                }

                case 10: { // Rank
                    const { rref, rank } = gaussianEliminate(matrixData.A);
                    resultContent.innerHTML = `<div class="result-text-block" style="font-size: 1.2rem; color: var(--accent);">
                        Matrix Rank rank(A) = <strong>${rank}</strong>
                    </div>`;
                    stepsHtml = `
                        <div class="step-card"><div class="step-title">Step 1: Gaussian Elimination</div>Perform row operations to reduce A to Row-Echelon Form (RREF).</div>
                        <div class="step-card"><div class="step-title">Step 2: Count Non-Zero Rows</div>Rank is the number of non-zero rows = ${rank}.</div>
                    `;
                    break;
                }

                case 11: { // Trace
                    const tr = traceMatrix(matrixData.A);
                    resultContent.innerHTML = `<div class="result-text-block" style="font-size: 1.2rem; color: var(--primary);">
                        Trace tr(A) = <strong>${tr.toFixed(4)}</strong>
                    </div>`;
                    stepsHtml = `<div class="step-card"><div class="step-title">Step 1: Sum Diagonal</div>tr(A) = ∑ A[i,i] = ${tr.toFixed(4)}.</div>`;
                    break;
                }

                case 12: { // Adjoint
                    const adj = adjointMatrix(matrixData.A);
                    renderMatrixOutput(adj, "Adjoint Matrix adj(A)");
                    lastComputedResultMat = adj;
                    lastComputedLatex = `\\text{adj}(A) = ` + matrixToLatex(adj);
                    stepsHtml = `<div class="step-card"><div class="step-title">Step 1: Transpose of Cofactor Matrix</div>adj(A) = (cof(A))ᵀ.</div>`;
                    break;
                }

                case 13: { // Cofactor
                    const cof = cofactorMatrix(matrixData.A);
                    renderMatrixOutput(cof, "Cofactor Matrix cof(A)");
                    lastComputedResultMat = cof;
                    lastComputedLatex = `\\text{cof}(A) = ` + matrixToLatex(cof);
                    stepsHtml = `<div class="step-card"><div class="step-title">Step 1: Minor Determinants</div>C[i,j] = (-1)^(i+j) * det(Minor M_{i,j}).</div>`;
                    break;
                }

                case 14: { // Gaussian Elimination
                    const { rref, rank } = gaussianEliminate(matrixData.A);
                    renderMatrixOutput(rref, `Row-Echelon Form (Rank = ${rank})`);
                    lastComputedResultMat = rref;
                    lastComputedLatex = matrixToLatex(rref);
                    stepsHtml = `
                        <div class="step-card"><div class="step-title">Step 1: Pivot Selection</div>Find largest absolute entry in column for numerical stability.</div>
                        <div class="step-card"><div class="step-title">Step 2: Row Subtractions</div>Subtract multiples of pivot row to zero out entries below pivot.</div>
                    `;
                    break;
                }

                case 15: { // LU Decomposition
                    const lu = luDecompose(matrixData.A);
                    if (lu) {
                        resultContent.innerHTML = `
                            <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
                                <div>
                                    <h4 style="color: var(--primary); margin-bottom: 0.5rem;">Lower Triangular (L)</h4>
                                    ${formatMatrixHtml(lu.L)}
                                </div>
                                <div>
                                    <h4 style="color: var(--accent); margin-bottom: 0.5rem;">Upper Triangular (U)</h4>
                                    ${formatMatrixHtml(lu.U)}
                                </div>
                            </div>
                        `;
                        lastComputedResultMat = lu.U;
                        lastComputedLatex = `L = ` + matrixToLatex(lu.L) + `, \\quad U = ` + matrixToLatex(lu.U);
                        stepsHtml = `
                            <div class="step-card"><div class="step-title">Step 1: Doolittle Factorization</div>Set L diagonal entries to 1.</div>
                            <div class="step-card"><div class="step-title">Step 2: Iterative Solution</div>Solve for U entries in row i, then L entries in column i.</div>
                        `;
                    } else {
                        resultContent.innerHTML = `<div class="result-text-block" style="color: var(--danger);">
                            LU decomposition without pivoting failed (zero pivot encountered).
                        </div>`;
                    }
                    break;
                }

                case 16: { // Power
                    if (powerVal < 0) {
                        resultContent.innerHTML = `<div class="result-text-block" style="color: var(--danger);">Negative powers are not supported.</div>`;
                        break;
                    }
                    const res = matrixPower(matrixData.A, powerVal);
                    renderMatrixOutput(res, `Matrix Power (A^${powerVal})`);
                    lastComputedResultMat = res;
                    lastComputedLatex = `A^{${powerVal}} = ` + matrixToLatex(res);
                    stepsHtml = `<div class="step-card"><div class="step-title">Fast Binary Exponentiation</div>Repeated squaring to compute A^${powerVal} in O(log p) matrix multiplications.</div>`;
                    break;
                }

                case 17: { // Solve Ax = b
                    const n = matrixData.A.length;
                    if (vectorB.length < n) {
                        resultContent.innerHTML = `<div class="result-text-block" style="color: var(--danger);">Please enter at least ${n} values for vector b.</div>`;
                        break;
                    }
                    const x = solveLinearSystem(matrixData.A, vectorB.slice(0, n));
                    if (x) {
                        let outHtml = `<div class="result-text-block"><strong>Solution Vector x:</strong>\n`;
                        x.forEach((val, idx) => {
                            outHtml += `x_${idx + 1} = ${val.toFixed(4)}\n`;
                        });
                        outHtml += `</div>`;
                        resultContent.innerHTML = outHtml;
                        lastComputedResultMat = x.map(val => [val]);
                        lastComputedLatex = `x = \\begin{bmatrix} ${x.map(v => v.toFixed(4)).join(' \\\\ ')} \\end{bmatrix}`;

                        stepsHtml = `
                            <div class="step-card"><div class="step-title">Step 1: Augmented Matrix [A | b]</div>Form n × (n+1) matrix combining A and b.</div>
                            <div class="step-card"><div class="step-title">Step 2: Gaussian Elimination</div>Reduce to upper triangular form via row operations.</div>
                            <div class="step-card"><div class="step-title">Step 3: Back Substitution</div>Solve for x_n down to x_1.</div>
                        `;
                    } else {
                        resultContent.innerHTML = `<div class="result-text-block" style="color: var(--danger);">System has no unique solution (Singular Matrix A).</div>`;
                    }
                    break;
                }

                case 18: { // Eigenvalues
                    const n = matrixData.A.length;
                    if (n !== 2 && n !== 3) {
                        resultContent.innerHTML = `<div class="result-text-block" style="color: var(--warning);">Eigenvalues supported for 2×2 and 3×3 matrices.</div>`;
                        break;
                    }
                    const evs = (n === 2) ? eigen2x2(matrixData.A) : eigen3x3(matrixData.A);
                    let outHtml = `<div class="result-text-block"><strong>Eigenvalues (λ):</strong>\n`;
                    evs.forEach((e, i) => {
                        if (Math.abs(e.im) < EPS) {
                            outHtml += `λ_${i+1} = ${e.re.toFixed(4)}${e.repeated ? ' (repeated)' : ''}\n`;
                        } else {
                            const sign = e.im >= 0 ? '+' : '-';
                            outHtml += `λ_${i+1} = ${e.re.toFixed(4)} ${sign} ${Math.abs(e.im).toFixed(4)}i\n`;
                        }
                    });
                    outHtml += `</div>`;
                    resultContent.innerHTML = outHtml;

                    if (n === 2) {
                        stepsHtml = `
                            <div class="step-card"><div class="step-title">Step 1: Characteristic Equation</div>det(A - λI) = λ² - tr(A)λ + det(A) = 0.</div>
                            <div class="step-card"><div class="step-title">Step 2: Quadratic Formula</div>Solve λ = (tr ± √(tr² - 4*det)) / 2.</div>
                        `;
                    } else {
                        stepsHtml = `
                            <div class="step-card"><div class="step-title">Step 1: Characteristic Cubic Equation</div>det(A - λI) = -λ³ + tr(A)λ² - M₂λ + det(A) = 0.</div>
                            <div class="step-card"><div class="step-title">Step 2: Cardano's Formula</div>Solve cubic equation for real and complex roots.</div>
                        `;
                    }
                    break;
                }
            }

            resultStepsContent.innerHTML = stepsHtml;

            // Trigger MathJax if available
            if (window.MathJax && MathJax.typesetPromise) {
                MathJax.typesetPromise();
            }

        } catch (err) {
            resultContent.innerHTML = `<div class="result-text-block" style="color: var(--danger);">Error: ${err.message}</div>`;
        }
    });

    function formatMatrixHtml(mat) {
        const cols = mat[0].length;
        return `
            <div class="matrix-wrapper">
                <div class="matrix-brackets">
                    <div class="matrix-grid-table" style="grid-template-columns: repeat(${cols}, 1fr);">
                        ${mat.map(row => 
                            row.map(v => {
                                const formatted = Math.abs(v - Math.round(v)) < EPS ? Math.round(v) : v.toFixed(3);
                                return `<div class="matrix-cell" style="display:flex; align-items:center; justify-content:center;">${formatted}</div>`;
                            }).join('')
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    function renderMatrixOutput(mat, label) {
        resultContent.innerHTML = `
            <div style="margin-bottom: 0.5rem; color: var(--text-muted); font-size: 0.9rem;">${label} (${mat.length} × ${mat[0].length}):</div>
            ${formatMatrixHtml(mat)}
        `;
    }

    function matrixToLatex(mat) {
        let tex = "\\begin{bmatrix}\n";
        mat.forEach((row, i) => {
            tex += "  " + row.map(v => Math.abs(v - Math.round(v)) < EPS ? Math.round(v) : v.toFixed(3)).join(" & ");
            if (i < mat.length - 1) tex += " \\\\";
            tex += "\n";
        });
        tex += "\\end{bmatrix}";
        return tex;
    }

    // Store Result to Memory
    useResultAsInputBtn.addEventListener("click", () => {
        if (lastComputedResultMat) {
            saveLastResult(lastComputedResultMat);
            updateMemoryBadge();
            renderWorkspace();
            alert(`Result stored in memory buffer! (${lastComputedResultMat.length}×${lastComputedResultMat[0].length})`);
        } else {
            alert("No matrix result available to store.");
        }
    });

    // Copy Text
    copyResultTextBtn.addEventListener("click", () => {
        const text = resultContent.innerText;
        navigator.clipboard.writeText(text).then(() => {
            alert("Result text copied to clipboard!");
        });
    });

    // Copy LaTeX
    copyLatexBtn.addEventListener("click", () => {
        if (lastComputedLatex) {
            navigator.clipboard.writeText(lastComputedLatex).then(() => {
                alert("LaTeX code copied to clipboard!\n\n" + lastComputedLatex);
            });
        } else {
            alert("LaTeX export is not available for this operation.");
        }
    });

    // Initial render
    renderWorkspace();
});
