document.addEventListener("DOMContentLoaded", () => {
    let currentOp = 1;
    let matrixData = {
        A: [[complex(1, 0), complex(2, 0)], [complex(0, 0), complex(1.5, 0)]],
        B: [[complex(5, 0), complex(6, 0)], [complex(7, 0), complex(8, 0)]]
    };
    let scalarVal = complex(2, 0);
    let powerVal = 2;
    let identityN = 3;
    let vectorB = [complex(8, 0), complex(-11, 0)];
    let matrixCount = 2;

    // DOM Elements
    const visitorCountEl = document.getElementById("visitorCount");
    const opButtons = document.querySelectorAll(".op-btn");

    function initVisitorCounter() {
        let visits = parseInt(localStorage.getItem("matrix_studio_visits") || "0", 10) + 1;
        localStorage.setItem("matrix_studio_visits", visits);
        visitorCountEl.textContent = `Visits: ${visits}`;

        fetch("https://api.counterapi.dev/v1/matrix-studio-app-sibanand/visits/up")
            .then(res => res.json())
            .then(data => {
                if (data && data.count) {
                    visitorCountEl.textContent = `Visits: ${data.count}`;
                }
            })
            .catch(() => {});
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
    const resultVisualizerContent = document.getElementById("resultVisualizerContent");
    const useResultAsInputBtn = document.getElementById("useResultAsInputBtn");
    const copyResultTextBtn = document.getElementById("copyResultTextBtn");
    const copyLatexBtn = document.getElementById("copyLatexBtn");
    const memoryBadge = document.getElementById("memoryBadge");
    const memoryText = document.getElementById("memoryText");
    const clearMemoryBtn = document.getElementById("clearMemoryBtn");
    const presetSelect = document.getElementById("presetSelect");
    const tabOutputBtn = document.getElementById("tabOutputBtn");
    const tabStepsBtn = document.getElementById("tabStepsBtn");
    const tabVisualizerBtn = document.getElementById("tabVisualizerBtn");

    // Visualizer DOM
    const geoCanvas = document.getElementById("geoCanvas");
    const animTransformationBtn = document.getElementById("animTransformationBtn");
    const showGridCheck = document.getElementById("showGridCheck");
    const showEigenCheck = document.getElementById("showEigenCheck");
    const showAreaCheck = document.getElementById("showAreaCheck");
    const resetVizZoomBtn = document.getElementById("resetVizZoomBtn");
    const vizLegend = document.getElementById("vizLegend");

    let lastComputedResultMat = null;
    let lastComputedLatex = "";
    let animProgress = 1.0; // 0 = Identity, 1 = Full Matrix A
    let animReqId = null;
    let viewZoom = 40.0; // pixels per unit

    const opConfigs = {
        1: { title: "➕ Add Matrices", desc: "Computes element-wise sum of complex matrices.", badge: "Matching Dimensions", numMatrices: 2, allowMulti: true },
        2: { title: "✖️ Multiply Matrices", desc: "Computes matrix product A × B × ...", badge: "Cols(A) = Rows(B)", numMatrices: 2, allowMulti: true },
        3: { title: "🔄 Transpose Matrix", desc: "Swaps rows and columns (Aᵀ).", badge: "Single Matrix", numMatrices: 1 },
        4: { title: "➖ Subtract Matrices", desc: "Computes element-wise difference.", badge: "Matching Dimensions", numMatrices: 2, allowMulti: true },
        5: { title: "🔢 Scalar Multiplication", desc: "Multiplies every element by a complex scalar k.", badge: "Single Matrix + Scalar k", numMatrices: 1, hasScalar: true },
        6: { title: "🧊 Identity Matrix Generator", desc: "Generates square identity matrix I_n.", badge: "n × n Matrix", numMatrices: 0, hasIdentityN: true },
        7: { title: "⚖️ Compare Matrices", badge: "Matching Dimensions", desc: "Checks element-wise complex equality within 1e-9.", numMatrices: 2, allowMulti: true },
        8: { title: "🧮 Determinant", desc: "Calculates complex matrix determinant det(A).", badge: "Square Matrix (n × n)", numMatrices: 1, squareOnly: true },
        9: { title: "↩️ Inverse Matrix", badge: "Square Non-Singular", desc: "Calculates inverse matrix A⁻¹ such that A × A⁻¹ = I.", numMatrices: 1, squareOnly: true },
        10: { title: "📊 Matrix Rank", desc: "Finds maximum linearly independent rows/cols.", badge: "Row-Echelon Rank", numMatrices: 1 },
        11: { title: "📈 Trace", desc: "Sum of main diagonal elements tr(A).", badge: "Square Matrix (n × n)", numMatrices: 1, squareOnly: true },
        12: { title: "🪞 Adjoint Matrix", desc: "Transpose of cofactor matrix adj(A).", badge: "Square Matrix (n × n)", numMatrices: 1, squareOnly: true },
        13: { title: "🧩 Cofactor Matrix", desc: "Matrix of signed minor determinants.", badge: "Square Matrix (n × n)", numMatrices: 1, squareOnly: true },
        14: { title: "🪜 Gaussian Elimination", desc: "Reduces matrix to Row-Echelon Form (RREF).", badge: "Row Reduction", numMatrices: 1 },
        15: { title: "📐 LU Decomposition", desc: "Decomposes A into Lower & Upper triangular (A = L × U).", badge: "Doolittle Factorization", numMatrices: 1, squareOnly: true },
        16: { title: "⚡ Matrix Exponentiation", desc: "Fast binary exponentiation A^p.", badge: "Square Matrix ^ Power p", numMatrices: 1, squareOnly: true, hasPower: true },
        17: { title: "🎯 Solve System Ax = b", desc: "Solves complex linear system Ax = b.", badge: "Square Matrix A & Vector b", numMatrices: 1, squareOnly: true, hasVectorB: true },
        18: { title: "🌀 Eigenvalues (2x2 / 3x3)", desc: "Calculates roots of characteristic polynomial det(A - λI) = 0.", badge: "2×2 or 3×3 Square Matrix", numMatrices: 1, eigenOnly: true }
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
        if (val === "pauli") {
            matrixData.A = [
                [complex(0, 0), complex(0, -1)],
                [complex(0, 1), complex(0, 0)]
            ];
            currentOp = 8;
        } else if (val === "quantum") {
            matrixData.A = [
                [complex(1, 0), complex(0, 0)],
                [complex(0, 0), complex(0, 1)]
            ];
            currentOp = 18;
        } else if (val === "complex_system") {
            matrixData.A = [
                [complex(1, 1), complex(2, 0)],
                [complex(0, 1), complex(1, -1)]
            ];
            vectorB = [complex(3, -1), complex(2, 2)];
            currentOp = 17;
        } else if (val === "rotation") {
            const rad = Math.PI / 4;
            matrixData.A = [
                [complex(parseFloat(Math.cos(rad).toFixed(4)), 0), complex(parseFloat(-Math.sin(rad).toFixed(4)), 0)],
                [complex(parseFloat(Math.sin(rad).toFixed(4)), 0), complex(parseFloat(Math.cos(rad).toFixed(4)), 0)]
            ];
            currentOp = 3;
        } else if (val === "hilbert") {
            matrixData.A = [
                [complex(1.0, 0), complex(0.5, 0), complex(0.333, 0)],
                [complex(0.5, 0), complex(0.333, 0), complex(0.25, 0)],
                [complex(0.333, 0), complex(0.25, 0), complex(0.2, 0)]
            ];
            currentOp = 8;
        } else if (val === "system") {
            matrixData.A = [
                [complex(2, 0), complex(1, 0), complex(-1, 0)],
                [complex(-3, 0), complex(-1, 0), complex(2, 0)],
                [complex(-2, 0), complex(1, 0), complex(2, 0)]
            ];
            vectorB = [complex(8, 0), complex(-11, 0), complex(-3, 0)];
            currentOp = 17;
        } else if (val === "singular") {
            matrixData.A = [
                [complex(1, 0), complex(2, 0), complex(3, 0)],
                [complex(4, 0), complex(5, 0), complex(6, 0)],
                [complex(7, 0), complex(8, 0), complex(9, 0)]
            ];
            currentOp = 9;
        } else if (val === "eigen2") {
            matrixData.A = [
                [complex(4, 0), complex(-2, 0)],
                [complex(1, 0), complex(1, 0)]
            ];
            currentOp = 18;
        } else if (val === "eigen3") {
            matrixData.A = [
                [complex(2, 0), complex(-1, 0), complex(0, 0)],
                [complex(-1, 0), complex(2, 0), complex(-1, 0)],
                [complex(0, 0), complex(-1, 0), complex(2, 0)]
            ];
            currentOp = 18;
        }

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
        tabVisualizerBtn.classList.remove("active");
        resultContent.style.display = "block";
        resultStepsContent.style.display = "none";
        resultVisualizerContent.style.display = "none";
    });

    tabStepsBtn.addEventListener("click", () => {
        tabStepsBtn.classList.add("active");
        tabOutputBtn.classList.remove("active");
        tabVisualizerBtn.classList.remove("active");
        resultContent.style.display = "none";
        resultStepsContent.style.display = "block";
        resultVisualizerContent.style.display = "none";
    });

    tabVisualizerBtn.addEventListener("click", () => {
        tabVisualizerBtn.classList.add("active");
        tabOutputBtn.classList.remove("active");
        tabStepsBtn.classList.remove("active");
        resultContent.style.display = "none";
        resultStepsContent.style.display = "none";
        resultVisualizerContent.style.display = "block";
        render2DVisualizer();
    });

    // Visualizer Controls
    animTransformationBtn.addEventListener("click", () => {
        animProgress = 0.0;
        if (animReqId) cancelAnimationFrame(animReqId);
        function step() {
            animProgress += 0.02;
            if (animProgress >= 1.0) {
                animProgress = 1.0;
                render2DVisualizer();
            } else {
                render2DVisualizer();
                animReqId = requestAnimationFrame(step);
            }
        }
        animReqId = requestAnimationFrame(step);
    });

    showGridCheck.addEventListener("change", render2DVisualizer);
    showEigenCheck.addEventListener("change", render2DVisualizer);
    showAreaCheck.addEventListener("change", render2DVisualizer);
    resetVizZoomBtn.addEventListener("click", () => {
        viewZoom = 40.0;
        render2DVisualizer();
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

        paramRow.innerHTML = "";
        let showParamRow = false;

        if (cfg.hasScalar) {
            showParamRow = true;
            paramRow.innerHTML += `
                <div class="param-group">
                    <label>Scalar Value k (e.g. 2, 3+4i, -i):</label>
                    <input type="text" id="scalarInput" value="${formatComplex(scalarVal)}" style="width:120px;">
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
                    <input type="text" id="vectorBInput" value="${vectorB.map(formatComplex).join(', ')}" placeholder="e.g. 8, 3+4i, -i" style="width:260px;">
                </div>
            `;
        }

        paramRow.style.display = showParamRow ? "flex" : "none";

        if (cfg.hasScalar) {
            document.getElementById("scalarInput").addEventListener("input", (e) => {
                scalarVal = parseComplex(e.target.value);
                if (resultVisualizerContent.style.display !== "none") render2DVisualizer();
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
                vectorB = e.target.value.split(/[\s,]+/).filter(t => t.length > 0).map(parseComplex);
                if (resultVisualizerContent.style.display !== "none") render2DVisualizer();
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
                matrixData[key] = [[complex(1, 0), complex(0, 0)], [complex(0, 0), complex(1, 0)]];
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
                                    `<input type="text" class="matrix-cell" data-key="${key}" data-row="${r}" data-col="${c}" value="${formatComplex(val)}" placeholder="0">`
                                ).join('')
                            ).join('')}
                        </div>
                    </div>
                </div>
            `;
            matricesInputGrid.appendChild(card);
        }

        const cells = document.querySelectorAll(".matrix-cell");
        cells.forEach(cell => {
            cell.addEventListener("input", (e) => {
                const key = e.target.dataset.key;
                const r = parseInt(e.target.dataset.row, 10);
                const c = parseInt(e.target.dataset.col, 10);
                matrixData[key][r][c] = parseComplex(e.target.value);
                if (resultVisualizerContent.style.display !== "none") render2DVisualizer();
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
        const res = createMatrix(newRows, newCols, 0);
        for (let i = 0; i < Math.min(mat.length, newRows); i++) {
            for (let j = 0; j < Math.min(mat[0].length, newCols); j++) {
                res[i][j] = complex(mat[i][j]);
            }
        }
        return res;
    }

    fillRandomBtn.addEventListener("click", () => {
        Object.keys(matrixData).forEach(key => {
            const mat = matrixData[key];
            for (let i = 0; i < mat.length; i++) {
                for (let j = 0; j < mat[0].length; j++) {
                    const re = Math.floor(Math.random() * 11) - 5;
                    const im = Math.floor(Math.random() * 7) - 3;
                    mat[i][j] = complex(re, im);
                }
            }
        });
        renderWorkspace();
        if (resultVisualizerContent.style.display !== "none") render2DVisualizer();
    });

    resetInputsBtn.addEventListener("click", () => {
        Object.keys(matrixData).forEach(key => {
            const mat = matrixData[key];
            for (let i = 0; i < mat.length; i++) {
                for (let j = 0; j < mat[0].length; j++) {
                    mat[i][j] = complex(0, 0);
                }
            }
        });
        renderWorkspace();
        if (resultVisualizerContent.style.display !== "none") render2DVisualizer();
    });

    // Compute Handler
    computeBtn.addEventListener("click", () => {
        resultCard.style.display = "block";
        resultContent.innerHTML = "";
        resultStepsContent.innerHTML = "";
        lastComputedResultMat = null;
        lastComputedLatex = "";

        try {
            let stepsHtml = "";

            switch (currentOp) {
                case 1: {
                    let res = copyMatrix(matrixData.A);
                    const labels = ["A", "B", "C", "D"];
                    for (let m = 1; m < matrixCount; m++) {
                        const key = labels[m];
                        res = addMatrices(res, matrixData[key]);
                    }
                    renderMatrixOutput(res, `Sum of ${matrixCount} Complex Matrices`);
                    lastComputedResultMat = res;
                    lastComputedLatex = matrixToLatex(res);
                    stepsHtml = `<div class="step-card"><div class="step-title">Step 1: Complex Element-wise addition</div>Adding corresponding real and imaginary components C[i,j] = A[i,j] + B[i,j].</div>`;
                    break;
                }

                case 2: {
                    let res = copyMatrix(matrixData.A);
                    const labels = ["A", "B", "C", "D"];
                    for (let m = 1; m < matrixCount; m++) {
                        const key = labels[m];
                        res = multiplyMatrices(res, matrixData[key]);
                    }
                    renderMatrixOutput(res, `Product of ${matrixCount} Complex Matrices`);
                    lastComputedResultMat = res;
                    lastComputedLatex = matrixToLatex(res);
                    stepsHtml = `<div class="step-card"><div class="step-title">Step 1: Complex Matrix Product</div>Computing row-by-column complex dot product: C[i,j] = ∑ A[i,k] × B[k,j].</div>`;
                    break;
                }

                case 3: {
                    const res = transposeMatrix(matrixData.A);
                    renderMatrixOutput(res, "Transposed Matrix (Aᵀ)");
                    lastComputedResultMat = res;
                    lastComputedLatex = matrixToLatex(res);
                    stepsHtml = `<div class="step-card"><div class="step-title">Step 1: Swap Indices</div>Original complex entry A[i,j] moved to position Aᵀ[j,i].</div>`;
                    break;
                }

                case 4: {
                    let res = copyMatrix(matrixData.A);
                    const labels = ["A", "B", "C", "D"];
                    for (let m = 1; m < matrixCount; m++) {
                        const key = labels[m];
                        res = subtractMatrices(res, matrixData[key]);
                    }
                    renderMatrixOutput(res, `Difference of ${matrixCount} Complex Matrices`);
                    lastComputedResultMat = res;
                    lastComputedLatex = matrixToLatex(res);
                    stepsHtml = `<div class="step-card"><div class="step-title">Step 1: Complex Element-wise subtraction</div>Subtracting corresponding entries: C[i,j] = A[i,j] - B[i,j].</div>`;
                    break;
                }

                case 5: {
                    const res = scalarMultiply(matrixData.A, scalarVal);
                    renderMatrixOutput(res, `Scalar Result (${formatComplex(scalarVal)} × A)`);
                    lastComputedResultMat = res;
                    lastComputedLatex = matrixToLatex(res);
                    stepsHtml = `<div class="step-card"><div class="step-title">Step 1: Complex Scalar Multiplication</div>Multiplying every entry A[i,j] by scalar k = ${formatComplex(scalarVal)}.</div>`;
                    break;
                }

                case 6: {
                    const res = identityMatrix(identityN);
                    renderMatrixOutput(res, `Identity Matrix (I_${identityN})`);
                    lastComputedResultMat = res;
                    lastComputedLatex = matrixToLatex(res);
                    stepsHtml = `<div class="step-card"><div class="step-title">Step 1: Identity Matrix</div>Created ${identityN}×${identityN} matrix with (1+0i) on diagonal and 0 elsewhere.</div>`;
                    break;
                }

                case 7: {
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
                        ${allEqual ? "✔ All specified complex matrices are EQUAL." : "✖ The matrices are NOT equal."}
                    </div>`;
                    stepsHtml = `<div class="step-card"><div class="step-title">Comparison Result</div>Comparing magnitude difference |A[i,j] - B[i,j]| < EPS (1e-9).</div>`;
                    break;
                }

                case 8: {
                    const det = determinant(matrixData.A);
                    const formattedDet = formatComplex(det);
                    resultContent.innerHTML = `<div class="result-text-block" style="font-size: 1.25rem; color: var(--primary);">
                        Determinant det(A) = <strong>${formattedDet}</strong>
                    </div>`;
                    lastComputedLatex = `\\det(A) = ${formattedDet}`;
                    stepsHtml = `
                        <div class="step-card"><div class="step-title">Formula</div>Recursive Laplace minor expansion over complex numbers.</div>
                        <div class="step-card"><div class="step-title">Final Answer</div>det(A) = ${formattedDet}</div>
                    `;
                    break;
                }

                case 9: {
                    const det = determinant(matrixData.A);
                    const inv = inverseMatrix(matrixData.A);
                    if (inv) {
                        renderMatrixOutput(inv, "Inverse Matrix (A⁻¹)");
                        lastComputedResultMat = inv;
                        lastComputedLatex = `A^{-1} = ` + matrixToLatex(inv);
                        stepsHtml = `
                            <div class="step-card"><div class="step-title">Step 1: Check Determinant</div>det(A) = ${formatComplex(det)} ≠ 0 (Non-singular).</div>
                            <div class="step-card"><div class="step-title">Step 2: Adjoint Matrix</div>Compute complex cofactor matrix cof(A) and transpose to get adj(A).</div>
                            <div class="step-card"><div class="step-title">Step 3: Formula A⁻¹ = (1 / det(A)) × adj(A)</div>Complex division of every adj(A) element by det(A).</div>
                        `;
                    } else {
                        resultContent.innerHTML = `<div class="result-text-block" style="color: var(--danger);">
                            Matrix is Singular (det(A) ≈ 0). Inverse does not exist.
                        </div>`;
                        stepsHtml = `<div class="step-card"><div class="step-title">Singular Matrix</div>det(A) = 0, division by zero is undefined.</div>`;
                    }
                    break;
                }

                case 10: {
                    const { rref, rank } = gaussianEliminate(matrixData.A);
                    resultContent.innerHTML = `<div class="result-text-block" style="font-size: 1.2rem; color: var(--accent);">
                        Matrix Rank rank(A) = <strong>${rank}</strong>
                    </div>`;
                    stepsHtml = `
                        <div class="step-card"><div class="step-title">Step 1: Complex Gaussian Elimination</div>Reduce matrix to Row-Echelon Form using complex pivot operations.</div>
                        <div class="step-card"><div class="step-title">Step 2: Count Non-Zero Rows</div>Rank is the number of non-zero rows = ${rank}.</div>
                    `;
                    break;
                }

                case 11: {
                    const tr = traceMatrix(matrixData.A);
                    const formattedTr = formatComplex(tr);
                    resultContent.innerHTML = `<div class="result-text-block" style="font-size: 1.2rem; color: var(--primary);">
                        Trace tr(A) = <strong>${formattedTr}</strong>
                    </div>`;
                    stepsHtml = `<div class="step-card"><div class="step-title">Step 1: Sum Diagonal</div>tr(A) = ∑ A[i,i] = ${formattedTr}.</div>`;
                    break;
                }

                case 12: {
                    const adj = adjointMatrix(matrixData.A);
                    renderMatrixOutput(adj, "Adjoint Matrix adj(A)");
                    lastComputedResultMat = adj;
                    lastComputedLatex = `\\text{adj}(A) = ` + matrixToLatex(adj);
                    stepsHtml = `<div class="step-card"><div class="step-title">Step 1: Transpose of Cofactor Matrix</div>adj(A) = (cof(A))ᵀ.</div>`;
                    break;
                }

                case 13: {
                    const cof = cofactorMatrix(matrixData.A);
                    renderMatrixOutput(cof, "Cofactor Matrix cof(A)");
                    lastComputedResultMat = cof;
                    lastComputedLatex = `\\text{cof}(A) = ` + matrixToLatex(cof);
                    stepsHtml = `<div class="step-card"><div class="step-title">Step 1: Complex Minor Determinants</div>C[i,j] = (-1)^(i+j) × det(Minor M_{i,j}).</div>`;
                    break;
                }

                case 14: {
                    const { rref, rank } = gaussianEliminate(matrixData.A);
                    renderMatrixOutput(rref, `Row-Echelon Form (Rank = ${rank})`);
                    lastComputedResultMat = rref;
                    lastComputedLatex = matrixToLatex(rref);
                    stepsHtml = `
                        <div class="step-card"><div class="step-title">Step 1: Complex Pivot Selection</div>Find largest magnitude entry |z| in column for pivot stability.</div>
                        <div class="step-card"><div class="step-title">Step 2: Complex Row Operations</div>Subtract multiples of pivot row to eliminate lower entries.</div>
                    `;
                    break;
                }

                case 15: {
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
                            <div class="step-card"><div class="step-title">Step 1: Complex Doolittle Factorization</div>Solve L and U such that A = L × U.</div>
                        `;
                    } else {
                        resultContent.innerHTML = `<div class="result-text-block" style="color: var(--danger);">
                            LU decomposition without pivoting failed (zero pivot encountered).
                        </div>`;
                    }
                    break;
                }

                case 16: {
                    if (powerVal < 0) {
                        resultContent.innerHTML = `<div class="result-text-block" style="color: var(--danger);">Negative powers are not supported.</div>`;
                        break;
                    }
                    const res = matrixPower(matrixData.A, powerVal);
                    renderMatrixOutput(res, `Matrix Power (A^${powerVal})`);
                    lastComputedResultMat = res;
                    lastComputedLatex = `A^{${powerVal}} = ` + matrixToLatex(res);
                    stepsHtml = `<div class="step-card"><div class="step-title">Fast Binary Exponentiation</div>Repeated complex matrix multiplication to compute A^${powerVal}.</div>`;
                    break;
                }

                case 17: {
                    const n = matrixData.A.length;
                    if (vectorB.length < n) {
                        resultContent.innerHTML = `<div class="result-text-block" style="color: var(--danger);">Please enter at least ${n} complex values for vector b.</div>`;
                        break;
                    }
                    const x = solveLinearSystem(matrixData.A, vectorB.slice(0, n));
                    if (x) {
                        let outHtml = `<div class="result-text-block"><strong>Solution Vector x:</strong>\n`;
                        x.forEach((val, idx) => {
                            outHtml += `x_${idx + 1} = ${formatComplex(val)}\n`;
                        });
                        outHtml += `</div>`;
                        resultContent.innerHTML = outHtml;
                        lastComputedResultMat = x.map(val => [val]);
                        lastComputedLatex = `x = \\begin{bmatrix} ${x.map(formatComplex).join(' \\\\ ')} \\end{bmatrix}`;

                        stepsHtml = `
                            <div class="step-card"><div class="step-title">Step 1: Complex Augmented Matrix [A | b]</div>Form n × (n+1) matrix combining A and vector b.</div>
                            <div class="step-card"><div class="step-title">Step 2: Gaussian Elimination</div>Reduce to upper triangular form using complex arithmetic.</div>
                            <div class="step-card"><div class="step-title">Step 3: Back Substitution</div>Solve for x_n down to x_1.</div>
                        `;
                    } else {
                        resultContent.innerHTML = `<div class="result-text-block" style="color: var(--danger);">System has no unique solution (Singular Matrix A).</div>`;
                    }
                    break;
                }

                case 18: {
                    const n = matrixData.A.length;
                    if (n !== 2 && n !== 3) {
                        resultContent.innerHTML = `<div class="result-text-block" style="color: var(--warning);">Eigenvalues supported for 2×2 and 3×3 complex matrices.</div>`;
                        break;
                    }
                    const evs = (n === 2) ? eigen2x2(matrixData.A) : eigen3x3(matrixData.A);
                    let outHtml = `<div class="result-text-block"><strong>Complex Eigenvalues (λ):</strong>\n`;
                    evs.forEach((e, i) => {
                        outHtml += `λ_${i+1} = ${formatComplex(e)}\n`;
                    });
                    outHtml += `</div>`;
                    resultContent.innerHTML = outHtml;

                    if (n === 2) {
                        stepsHtml = `
                            <div class="step-card"><div class="step-title">Step 1: Complex Characteristic Equation</div>det(A - λI) = λ² - tr(A)λ + det(A) = 0.</div>
                            <div class="step-card"><div class="step-title">Step 2: Complex Quadratic Formula</div>Solve λ = (tr ± √(tr² - 4*det)) / 2.</div>
                        `;
                    } else {
                        stepsHtml = `
                            <div class="step-card"><div class="step-title">Step 1: Complex Characteristic Cubic</div>det(A - λI) = -λ³ + tr(A)λ² - M₂λ + det(A) = 0.</div>
                            <div class="step-card"><div class="step-title">Step 2: Complex Cardano's Formula</div>Solve complex cubic equation for 3 complex roots.</div>
                        `;
                    }
                    break;
                }
            }

            resultStepsContent.innerHTML = stepsHtml;

            if (window.MathJax && MathJax.typesetPromise) {
                MathJax.typesetPromise();
            }

            if (resultVisualizerContent.style.display !== "none") {
                render2DVisualizer();
            }

        } catch (err) {
            resultContent.innerHTML = `<div class="result-text-block" style="color: var(--danger);">Error: ${err.message}</div>`;
        }
    });

    /* =========================================================
       2D GEOMETRIC VISUALIZER CANVAS ENGINE
       ========================================================= */

    function render2DVisualizer() {
        if (!geoCanvas || !geoCanvas.getContext) return;
        const ctx = geoCanvas.getContext("2d");
        const width = geoCanvas.width;
        const height = geoCanvas.height;
        const originX = width / 2;
        const originY = height / 2;

        ctx.clearRect(0, 0, width, height);

        // Background
        ctx.fillStyle = "#080c14";
        ctx.fillRect(0, 0, width, height);

        // Get current 2D real components of Matrix A (using real part for 2D geometry)
        const a11_target = matrixData.A[0] && matrixData.A[0][0] ? matrixData.A[0][0].re : 1;
        const a12_target = matrixData.A[0] && matrixData.A[0][1] ? matrixData.A[0][1].re : 0;
        const a21_target = matrixData.A[1] && matrixData.A[1][0] ? matrixData.A[1][0].re : 0;
        const a22_target = matrixData.A[1] && matrixData.A[1][1] ? matrixData.A[1][1].re : 1;

        // Interpolated matrix M(t) = (1-t)I + t*A
        const t = animProgress;
        const m11 = (1 - t) * 1 + t * a11_target;
        const m12 = (1 - t) * 0 + t * a12_target;
        const m21 = (1 - t) * 0 + t * a21_target;
        const m22 = (1 - t) * 1 + t * a22_target;

        const scale = viewZoom;

        function toScreen(x, y) {
            return {
                x: originX + x * scale,
                y: originY - y * scale
            };
        }

        function transform(x, y) {
            return {
                x: m11 * x + m12 * y,
                y: m21 * x + m22 * y
            };
        }

        // Draw Deformed Grid
        if (showGridCheck.checked) {
            ctx.lineWidth = 1;
            const gridRange = 8;

            // Faint grid lines
            for (let g = -gridRange; g <= gridRange; g++) {
                // Vertical grid lines (constant x)
                ctx.beginPath();
                ctx.strokeStyle = (g === 0) ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)";
                for (let py = -gridRange; py <= gridRange; py += 0.5) {
                    const p1 = transform(g, py);
                    const s1 = toScreen(p1.x, p1.y);
                    if (py === -gridRange) ctx.moveTo(s1.x, s1.y);
                    else ctx.lineTo(s1.x, s1.y);
                }
                ctx.stroke();

                // Horizontal grid lines (constant y)
                ctx.beginPath();
                ctx.strokeStyle = (g === 0) ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)";
                for (let px = -gridRange; px <= gridRange; px += 0.5) {
                    const p2 = transform(px, g);
                    const s2 = toScreen(p2.x, p2.y);
                    if (px === -gridRange) ctx.moveTo(s2.x, s2.y);
                    else ctx.lineTo(s2.x, s2.y);
                }
                ctx.stroke();
            }
        }

        // Draw Coordinate Axes
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1.5;
        // X axis
        ctx.beginPath();
        ctx.moveTo(0, originY);
        ctx.lineTo(width, originY);
        ctx.stroke();
        // Y axis
        ctx.beginPath();
        ctx.moveTo(originX, 0);
        ctx.lineTo(originX, height);
        ctx.stroke();

        // Draw Transformed Unit Square (Determinant Area)
        const detArea = (m11 * m22 - m12 * m21);
        if (showAreaCheck.checked) {
            const p00 = toScreen(0, 0);
            const p10 = toScreen(...Object.values(transform(1, 0)));
            const p11 = toScreen(...Object.values(transform(1, 1)));
            const p01 = toScreen(...Object.values(transform(0, 1)));

            ctx.fillStyle = detArea >= 0 ? "rgba(56, 189, 248, 0.2)" : "rgba(248, 113, 113, 0.2)";
            ctx.strokeStyle = detArea >= 0 ? "#38bdf8" : "#f87171";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p00.x, p00.y);
            ctx.lineTo(p10.x, p10.y);
            ctx.lineTo(p11.x, p11.y);
            ctx.lineTo(p01.x, p01.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // Draw Basis Vectors i^ and j^
        const e1 = transform(1, 0);
        const e2 = transform(0, 1);
        drawArrow(ctx, toScreen(0, 0), toScreen(e1.x, e1.y), "#38bdf8", "A i^ (Col 1)", 3);
        drawArrow(ctx, toScreen(0, 0), toScreen(e2.x, e2.y), "#818cf8", "A j^ (Col 2)", 3);

        // If operation is System Ax = b (Case 17), draw lines & solution point!
        if (currentOp === 17 && vectorB.length >= 2) {
            const b1 = vectorB[0].re;
            const b2 = vectorB[1].re;

            // Line 1: a11*x + a12*y = b1 => y = (b1 - a11*x) / a12
            drawEquationLine(ctx, a11_target, a12_target, b1, "#fbbf24", toScreen, scale);
            // Line 2: a21*x + a22*y = b2 => y = (b2 - a21*x) / a22
            drawEquationLine(ctx, a21_target, a22_target, b2, "#34d399", toScreen, scale);

            // Solution point x = A^-1 b
            const solX = solveLinearSystem(
                [[complex(a11_target, 0), complex(a12_target, 0)], [complex(a21_target, 0), complex(a22_target, 0)]],
                [complex(b1, 0), complex(b2, 0)]
            );
            if (solX) {
                const sPt = toScreen(solX[0].re, solX[1].re);
                ctx.fillStyle = "#fbbf24";
                ctx.beginPath();
                ctx.arc(sPt.x, sPt.y, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = "#fff";
                ctx.font = "12px JetBrains Mono";
                ctx.fillText(`x = (${solX[0].re.toFixed(2)}, ${solX[1].re.toFixed(2)})`, sPt.x + 10, sPt.y - 10);
            }
        }

        // Draw Real Eigenvectors & Eigenlines
        if (showEigenCheck.checked && matrixData.A.length === 2 && matrixData.A[0].length === 2) {
            const realA = [[a11_target, a12_target], [a21_target, a22_target]];
            const evs = eigen2x2([[complex(a11_target, 0), complex(a12_target, 0)], [complex(a21_target, 0), complex(a22_target, 0)]]);
            
            evs.forEach((e, idx) => {
                if (Math.abs(e.im) < EPS) {
                    const lambda = e.re;
                    // Find eigenvector (A - lambda I) v = 0
                    let vx = 1, vy = 0;
                    if (Math.abs(realA[0][1]) > EPS) {
                        vx = 1;
                        vy = (lambda - realA[0][0]) / realA[0][1];
                    } else if (Math.abs(realA[1][0]) > EPS) {
                        vy = 1;
                        vx = (lambda - realA[1][1]) / realA[1][0];
                    }
                    const len = Math.hypot(vx, vy);
                    if (len > EPS) {
                        vx /= len; vy /= len;
                        // Draw infinite dashed eigenline
                        const p1 = toScreen(-10 * vx, -10 * vy);
                        const p2 = toScreen(10 * vx, 10 * vy);
                        ctx.beginPath();
                        ctx.setLineDash([5, 5]);
                        ctx.strokeStyle = idx === 0 ? "#fbbf24" : "#f472b6";
                        ctx.lineWidth = 1.5;
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                        ctx.setLineDash([]);

                        // Transformed eigenvector A v = lambda v
                        const vTrans = transform(vx, vy);
                        drawArrow(ctx, toScreen(0,0), toScreen(vTrans.x, vTrans.y), idx === 0 ? "#fbbf24" : "#f472b6", `v${idx+1} (λ=${lambda.toFixed(2)})`, 2.5);
                    }
                }
            });
        }

        // Legend Badges
        vizLegend.innerHTML = `
            <div class="legend-item"><div class="legend-color" style="background:#38bdf8;"></div>A i^ (${e1.x.toFixed(2)}, ${e1.y.toFixed(2)})</div>
            <div class="legend-item"><div class="legend-color" style="background:#818cf8;"></div>A j^ (${e2.x.toFixed(2)}, ${e2.y.toFixed(2)})</div>
            <div class="legend-item"><div class="legend-color" style="background:rgba(56,189,248,0.4);"></div>det(A) = ${detArea.toFixed(2)}</div>
            ${currentOp === 17 ? `<div class="legend-item"><div class="legend-color" style="background:#fbbf24;"></div>Line 1</div><div class="legend-item"><div class="legend-color" style="background:#34d399;"></div>Line 2</div>` : ''}
        `;
    }

    function drawArrow(ctx, from, to, color, label, width = 2) {
        const headlen = 10;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const angle = Math.atan2(dy, dx);

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = width;

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - headlen * Math.cos(angle - Math.PI / 6), to.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(to.x - headlen * Math.cos(angle + Math.PI / 6), to.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        if (label) {
            ctx.font = "12px JetBrains Mono";
            ctx.fillText(label, to.x + 8, to.y - 4);
        }
    }

    function drawEquationLine(ctx, a, b, cVal, color, toScreen, scale) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        if (Math.abs(b) > EPS) {
            const x1 = -10, y1 = (cVal - a * x1) / b;
            const x2 = 10, y2 = (cVal - a * x2) / b;
            const s1 = toScreen(x1, y1);
            const s2 = toScreen(x2, y2);
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
        } else if (Math.abs(a) > EPS) {
            const x = cVal / a;
            const s1 = toScreen(x, -10);
            const s2 = toScreen(x, 10);
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
        }
        ctx.stroke();
    }

    function formatMatrixHtml(mat) {
        const cols = mat[0].length;
        return `
            <div class="matrix-wrapper">
                <div class="matrix-brackets">
                    <div class="matrix-grid-table" style="grid-template-columns: repeat(${cols}, 1fr);">
                        ${mat.map(row => 
                            row.map(v => {
                                return `<div class="matrix-cell" style="display:flex; align-items:center; justify-content:center; padding: 0 4px;">${formatComplex(v)}</div>`;
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
            tex += "  " + row.map(v => formatComplex(v)).join(" & ");
            if (i < mat.length - 1) tex += " \\\\";
            tex += "\n";
        });
        tex += "\\end{bmatrix}";
        return tex;
    }

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

    copyResultTextBtn.addEventListener("click", () => {
        const text = resultContent.innerText;
        navigator.clipboard.writeText(text).then(() => {
            alert("Result text copied to clipboard!");
        });
    });

    copyLatexBtn.addEventListener("click", () => {
        if (lastComputedLatex) {
            navigator.clipboard.writeText(lastComputedLatex).then(() => {
                alert("LaTeX code copied to clipboard!\n\n" + lastComputedLatex);
            });
        } else {
            alert("LaTeX export is not available for this operation.");
        }
    });

    renderWorkspace();
});
