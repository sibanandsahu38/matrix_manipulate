/**
 * Matrix Calculator Engine (JavaScript implementation of C Matrix Library)
 */

const EPS = 1e-9;

// Global Last Result Memory
let lastResultState = {
    matrix: null,
    rows: 0,
    cols: 0,
    hasResult: false
};

function saveLastResult(mat) {
    const rows = mat.length;
    const cols = mat[0].length;
    lastResultState.matrix = copyMatrix(mat);
    lastResultState.rows = rows;
    lastResultState.cols = cols;
    lastResultState.hasResult = true;
}

function getLastResult() {
    return lastResultState;
}

function createMatrix(rows, cols, fillValue = 0.0) {
    const mat = [];
    for (let i = 0; i < rows; i++) {
        mat.push(new Array(cols).fill(fillValue));
    }
    return mat;
}

function copyMatrix(mat) {
    return mat.map(row => [...row]);
}

function printMatrix(mat) {
    const rows = mat.length;
    const cols = mat[0].length;
    let out = "";
    for (let i = 0; i < rows; i++) {
        let rowStr = "";
        for (let j = 0; j < cols; j++) {
            const v = mat[i][j];
            if (Math.abs(v - Math.round(v)) < EPS) {
                rowStr += Math.round(v).toString().padStart(9) + " ";
            } else {
                rowStr += v.toFixed(3).padStart(9) + " ";
            }
        }
        out += rowStr + "\n";
    }
    return out;
}

/* =========================================================
   BASIC OPERATIONS
   ========================================================= */

function addMatrices(a, b) {
    const rows = a.length;
    const cols = a[0].length;
    const res = createMatrix(rows, cols);
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            res[i][j] = a[i][j] + b[i][j];
        }
    }
    return res;
}

function subtractMatrices(a, b) {
    const rows = a.length;
    const cols = a[0].length;
    const res = createMatrix(rows, cols);
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            res[i][j] = a[i][j] - b[i][j];
        }
    }
    return res;
}

function multiplyMatrices(a, b) {
    const rowsA = a.length;
    const colsA = a[0].length;
    const rowsB = b.length;
    const colsB = b[0].length;
    if (colsA !== rowsB) {
        throw new Error(`Dimension mismatch: colsA (${colsA}) must equal rowsB (${rowsB})`);
    }
    const res = createMatrix(rowsA, colsB);
    for (let i = 0; i < rowsA; i++) {
        for (let j = 0; j < colsB; j++) {
            let sum = 0.0;
            for (let k = 0; k < colsA; k++) {
                sum += a[i][k] * b[k][j];
            }
            res[i][j] = sum;
        }
    }
    return res;
}

function scalarMultiply(mat, scalar) {
    const rows = mat.length;
    const cols = mat[0].length;
    const res = createMatrix(rows, cols);
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            res[i][j] = mat[i][j] * scalar;
        }
    }
    return res;
}

function transposeMatrix(mat) {
    const rows = mat.length;
    const cols = mat[0].length;
    const res = createMatrix(cols, rows);
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            res[j][i] = mat[i][j];
        }
    }
    return res;
}

function identityMatrix(n) {
    const mat = createMatrix(n, n);
    for (let i = 0; i < n; i++) {
        mat[i][i] = 1.0;
    }
    return mat;
}

function compareMatrices(a, b, eps = EPS) {
    const rows = a.length;
    const cols = a[0].length;
    if (b.length !== rows || b[0].length !== cols) return false;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (Math.abs(a[i][j] - b[i][j]) > eps) {
                return false;
            }
        }
    }
    return true;
}

// Fast binary matrix exponentiation
function matrixPower(mat, p) {
    const n = mat.length;
    let base = copyMatrix(mat);
    let result = identityMatrix(n);
    let pow = p;
    while (pow > 0) {
        if (pow % 2 === 1) {
            result = multiplyMatrices(result, base);
        }
        base = multiplyMatrices(base, base);
        pow = Math.floor(pow / 2);
    }
    return result;
}

/* =========================================================
   DETERMINANT / INVERSE / ADJOINT / COFACTOR
   ========================================================= */

function getMinor(mat, p, q) {
    const n = mat.length;
    const minor = [];
    for (let i = 0; i < n; i++) {
        if (i === p) continue;
        const row = [];
        for (let j = 0; j < n; j++) {
            if (j === q) continue;
            row.push(mat[i][j]);
        }
        minor.push(row);
    }
    return minor;
}

function determinant(mat) {
    const n = mat.length;
    if (n === 1) return mat[0][0];
    if (n === 2) return mat[0][0] * mat[1][1] - mat[0][1] * mat[1][0];

    let det = 0.0;
    let sign = 1;
    for (let f = 0; f < n; f++) {
        const minor = getMinor(mat, 0, f);
        det += sign * mat[0][f] * determinant(minor);
        sign = -sign;
    }
    return det;
}

function cofactorMatrix(mat) {
    const n = mat.length;
    const cof = createMatrix(n, n);
    if (n === 1) {
        cof[0][0] = 1.0;
        return cof;
    }
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const minor = getMinor(mat, i, j);
            const sign = ((i + j) % 2 === 0) ? 1 : -1;
            cof[i][j] = sign * determinant(minor);
        }
    }
    return cof;
}

function adjointMatrix(mat) {
    const n = mat.length;
    const cof = cofactorMatrix(mat);
    const adj = createMatrix(n, n);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            adj[j][i] = cof[i][j];
        }
    }
    return adj;
}

function inverseMatrix(mat) {
    const n = mat.length;
    const det = determinant(mat);
    if (Math.abs(det) < EPS) return null; // Singular matrix
    const adj = adjointMatrix(mat);
    const inv = createMatrix(n, n);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            inv[i][j] = adj[i][j] / det;
        }
    }
    return inv;
}

function traceMatrix(mat) {
    const n = mat.length;
    let t = 0.0;
    for (let i = 0; i < n; i++) {
        t += mat[i][i];
    }
    return t;
}

/* =========================================================
   RANK / GAUSSIAN ELIMINATION / LU / LINEAR SOLVE
   ========================================================= */

function gaussianEliminate(inputMat) {
    const mat = copyMatrix(inputMat);
    const rows = mat.length;
    const cols = mat[0].length;
    let rank = 0;

    for (let col = 0; col < cols && rank < rows; col++) {
        let pivot = -1;
        let best = EPS;
        for (let r = rank; r < rows; r++) {
            if (Math.abs(mat[r][col]) > best) {
                best = Math.abs(mat[r][col]);
                pivot = r;
            }
        }
        if (pivot === -1) continue;

        // Swap rows
        for (let c = 0; c < cols; c++) {
            const tmp = mat[rank][c];
            mat[rank][c] = mat[pivot][c];
            mat[pivot][c] = tmp;
        }

        // Eliminate below
        for (let r = rank + 1; r < rows; r++) {
            const factor = mat[r][col] / mat[rank][col];
            for (let c = col; c < cols; c++) {
                mat[r][c] -= factor * mat[rank][c];
            }
        }
        rank++;
    }
    return { rref: mat, rank };
}

function luDecompose(mat) {
    const n = mat.length;
    const L = createMatrix(n, n, 0.0);
    const U = createMatrix(n, n, 0.0);

    for (let i = 0; i < n; i++) {
        for (let k = i; k < n; k++) {
            let sum = 0.0;
            for (let j = 0; j < i; j++) {
                sum += L[i][j] * U[j][k];
            }
            U[i][k] = mat[i][k] - sum;
        }
        if (Math.abs(U[i][i]) < EPS) return null; // Zero pivot encountered

        for (let k = i; k < n; k++) {
            if (i === k) {
                L[i][i] = 1.0;
            } else {
                let sum = 0.0;
                for (let j = 0; j < i; j++) {
                    sum += L[k][j] * U[j][i];
                }
                L[k][i] = (mat[k][i] - sum) / U[i][i];
            }
        }
    }
    return { L, U };
}

function solveLinearSystem(A, b) {
    const n = A.length;
    const aug = createMatrix(n, n + 1);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            aug[i][j] = A[i][j];
        }
        aug[i][n] = b[i];
    }

    for (let i = 0; i < n; i++) {
        let pivot = i;
        let best = Math.abs(aug[i][i]);
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(aug[k][i]) > best) {
                best = Math.abs(aug[k][i]);
                pivot = k;
            }
        }
        if (best < EPS) return null; // Singular matrix

        // Swap pivot row
        for (let c = 0; c <= n; c++) {
            const tmp = aug[i][c];
            aug[i][c] = aug[pivot][c];
            aug[pivot][c] = tmp;
        }

        // Eliminate
        for (let k = i + 1; k < n; k++) {
            const factor = aug[k][i] / aug[i][i];
            for (let c = i; c <= n; c++) {
                aug[k][c] -= factor * aug[i][c];
            }
        }
    }

    // Back substitution
    const x = new Array(n).fill(0.0);
    for (let i = n - 1; i >= 0; i--) {
        let sum = aug[i][n];
        for (let j = i + 1; j < n; j++) {
            sum -= aug[i][j] * x[j];
        }
        x[i] = sum / aug[i][i];
    }
    return x;
}

/* =========================================================
   EIGENVALUES (2x2 and 3x3)
   ========================================================= */

function eigen2x2(mat) {
    const a = mat[0][0], b = mat[0][1], c = mat[1][0], d = mat[1][1];
    const tr = a + d;
    const det = a * d - b * c;
    const disc = tr * tr - 4 * det;

    if (disc >= 0) {
        const sq = Math.sqrt(disc);
        return [
            { re: (tr + sq) / 2, im: 0 },
            { re: (tr - sq) / 2, im: 0 }
        ];
    } else {
        const re = tr / 2;
        const im = Math.sqrt(-disc) / 2;
        return [
            { re: re, im: im },
            { re: re, im: -im }
        ];
    }
}

function solveCubic(B, C, D) {
    const p = C - (B * B) / 3.0;
    const q = (2 * B * B * B) / 27.0 - (B * C) / 3.0 + D;
    const disc = (q * q) / 4.0 + (p * p * p) / 27.0;
    const shift = B / 3.0;

    if (disc > EPS) {
        const sq = Math.sqrt(disc);
        const u = Math.cbrt(-q / 2.0 + sq);
        const v = Math.cbrt(-q / 2.0 - sq);
        const x1 = u + v - shift;
        const re = -(u + v) / 2.0 - shift;
        const im = (Math.sqrt(3.0) / 2.0) * (u - v);
        return [
            { re: x1, im: 0 },
            { re: re, im: im },
            { re: re, im: -im }
        ];
    } else if (Math.abs(disc) <= EPS) {
        const u = Math.cbrt(-q / 2.0);
        const x1 = 2 * u - shift;
        const x2 = -u - shift;
        return [
            { re: x1, im: 0 },
            { re: x2, im: 0, repeated: true },
            { re: x2, im: 0, repeated: true }
        ];
    } else {
        const r = Math.sqrt((-p * p * p) / 27.0);
        const phi = Math.acos(-q / (2.0 * r));
        const m = 2.0 * Math.sqrt(-p / 3.0);
        const x1 = m * Math.cos(phi / 3.0) - shift;
        const x2 = m * Math.cos((phi + 2 * Math.PI) / 3.0) - shift;
        const x3 = m * Math.cos((phi + 4 * Math.PI) / 3.0) - shift;
        return [
            { re: x1, im: 0 },
            { re: x2, im: 0 },
            { re: x3, im: 0 }
        ];
    }
}

function eigen3x3(mat) {
    const T = traceMatrix(mat);
    const M2 = (mat[0][0] * mat[1][1] - mat[0][1] * mat[1][0])
             + (mat[0][0] * mat[2][2] - mat[0][2] * mat[2][0])
             + (mat[1][1] * mat[2][2] - mat[1][2] * mat[2][1]);
    const D = determinant(mat);
    return solveCubic(-T, M2, -D);
}

// Export for Node.js / Module and Browser globals
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EPS,
        saveLastResult,
        getLastResult,
        createMatrix,
        copyMatrix,
        printMatrix,
        addMatrices,
        subtractMatrices,
        multiplyMatrices,
        scalarMultiply,
        transposeMatrix,
        identityMatrix,
        compareMatrices,
        matrixPower,
        getMinor,
        determinant,
        cofactorMatrix,
        adjointMatrix,
        inverseMatrix,
        traceMatrix,
        gaussianEliminate,
        luDecompose,
        solveLinearSystem,
        eigen2x2,
        solveCubic,
        eigen3x3
    };
}
