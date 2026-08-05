/**
 * Complex Matrix Engine - JavaScript implementation of C Complex Matrix Library
 * Supports complex number entries like: 5, -3.5, 4i, -i, i, 3+4i, -3-4i
 */

const EPS = 1e-9;

/* =========================================================
   COMPLEX NUMBER UTILITIES & ARITHMETIC
   ========================================================= */

function complex(re = 0, im = 0) {
    if (typeof re === 'object' && re !== null && 're' in re) {
        return { re: re.re || 0, im: re.im || 0 };
    }
    return { re: Number(re) || 0, im: Number(im) || 0 };
}

function parseComplex(s) {
    if (typeof s === 'number') return complex(s, 0);
    if (typeof s === 'object' && s !== null && 're' in s) return complex(s.re, s.im);
    if (!s || typeof s !== 'string') return complex(0, 0);

    let buf = s.trim().replace(/\s+/g, '');
    if (!buf) return complex(0, 0);

    const hasI = buf.endsWith('i') || buf.endsWith('I');
    if (!hasI) {
        const val = parseFloat(buf);
        return complex(isNaN(val) ? 0 : val, 0);
    }

    buf = buf.slice(0, -1); // strip trailing i
    if (buf === '' || buf === '+') return complex(0, 1);
    if (buf === '-') return complex(0, -1);

    // Look for '+' or '-' separator after position 0
    let split = -1;
    for (let i = 1; i < buf.length; i++) {
        if (buf[i] === '+' || buf[i] === '-') {
            split = i;
            break;
        }
    }

    if (split === -1) {
        // Purely imaginary
        const val = parseFloat(buf);
        return complex(0, isNaN(val) ? 0 : val);
    } else {
        const realPart = buf.substring(0, split);
        const imagPart = buf.substring(split);
        const re = parseFloat(realPart);
        let im;
        if (imagPart === '+' || imagPart === '') im = 1;
        else if (imagPart === '-') im = -1;
        else im = parseFloat(imagPart);
        return complex(isNaN(re) ? 0 : re, isNaN(im) ? 0 : im);
    }
}

function formatNumber(v) {
    if (Math.abs(v - Math.round(v)) < EPS) {
        return Math.round(v).toString();
    }
    return parseFloat(v.toFixed(4)).toString();
}

function formatComplex(z) {
    z = complex(z);
    let re = z.re;
    let im = z.im;
    if (Math.abs(re) < EPS) re = 0;
    if (Math.abs(im) < EPS) im = 0;

    if (im === 0) {
        return formatNumber(re);
    }
    if (re === 0) {
        if (Math.abs(im - 1) < EPS) return "i";
        if (Math.abs(im + 1) < EPS) return "-i";
        return `${formatNumber(im)}i`;
    }
    if (Math.abs(im - 1) < EPS) {
        return `${formatNumber(re)}+i`;
    }
    if (Math.abs(im + 1) < EPS) {
        return `${formatNumber(re)}-i`;
    }
    if (im > 0) {
        return `${formatNumber(re)}+${formatNumber(im)}i`;
    }
    return `${formatNumber(re)}${formatNumber(im)}i`; // negative already includes '-'
}

function cAdd(a, b) {
    a = complex(a); b = complex(b);
    return complex(a.re + b.re, a.im + b.im);
}

function cSub(a, b) {
    a = complex(a); b = complex(b);
    return complex(a.re - b.re, a.im - b.im);
}

function cMul(a, b) {
    a = complex(a); b = complex(b);
    return complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
}

function cDiv(a, b) {
    a = complex(a); b = complex(b);
    const denom = b.re * b.re + b.im * b.im;
    if (denom < 1e-15) return complex(0, 0);
    return complex(
        (a.re * b.re + a.im * b.im) / denom,
        (a.im * b.re - a.re * b.im) / denom
    );
}

function cAbs(z) {
    z = complex(z);
    return Math.hypot(z.re, z.im);
}

function cSqrt(z) {
    z = complex(z);
    const r = cAbs(z);
    if (r < 1e-12) return complex(0, 0);
    const re = Math.sqrt((r + z.re) / 2);
    const sign = z.im < 0 ? -1 : 1;
    const im = sign * Math.sqrt(Math.max(0, (r - z.re) / 2));
    return complex(re, im);
}

function cPow(z, p) {
    z = complex(z);
    const r = cAbs(z);
    if (r < 1e-12) return complex(0, 0);
    const theta = Math.atan2(z.im, z.re);
    const rP = Math.pow(r, p);
    const thetaP = theta * p;
    return complex(rP * Math.cos(thetaP), rP * Math.sin(thetaP));
}

function cConj(z) {
    z = complex(z);
    return complex(z.re, -z.im);
}

/* =========================================================
   GLOBAL LAST RESULT MEMORY
   ========================================================= */

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

/* =========================================================
   CORE MATRIX I/O & CREATION
   ========================================================= */

function createMatrix(rows, cols, fillValue = 0) {
    const mat = [];
    const val = complex(fillValue);
    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            row.push(complex(val.re, val.im));
        }
        mat.push(row);
    }
    return mat;
}

function copyMatrix(mat) {
    return mat.map(row => row.map(cell => complex(cell)));
}

function printMatrix(mat) {
    const rows = mat.length;
    const cols = mat[0].length;
    let out = "";
    for (let i = 0; i < rows; i++) {
        let rowStr = "";
        for (let j = 0; j < cols; j++) {
            const formatted = formatComplex(mat[i][j]);
            rowStr += formatted.padStart(14) + " ";
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
            res[i][j] = cAdd(a[i][j], b[i][j]);
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
            res[i][j] = cSub(a[i][j], b[i][j]);
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
            let sum = complex(0, 0);
            for (let k = 0; k < colsA; k++) {
                sum = cAdd(sum, cMul(a[i][k], b[k][j]));
            }
            res[i][j] = sum;
        }
    }
    return res;
}

function scalarMultiply(mat, scalar) {
    scalar = complex(scalar);
    const rows = mat.length;
    const cols = mat[0].length;
    const res = createMatrix(rows, cols);
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            res[i][j] = cMul(mat[i][j], scalar);
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
            res[j][i] = complex(mat[i][j]);
        }
    }
    return res;
}

function identityMatrix(n) {
    const mat = createMatrix(n, n);
    for (let i = 0; i < n; i++) {
        mat[i][i] = complex(1, 0);
    }
    return mat;
}

function compareMatrices(a, b, eps = EPS) {
    const rows = a.length;
    const cols = a[0].length;
    if (b.length !== rows || b[0].length !== cols) return false;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (cAbs(cSub(a[i][j], b[i][j])) > eps) {
                return false;
            }
        }
    }
    return true;
}

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
            row.push(complex(mat[i][j]));
        }
        minor.push(row);
    }
    return minor;
}

function determinant(mat) {
    const n = mat.length;
    if (n === 1) return complex(mat[0][0]);
    if (n === 2) {
        return cSub(cMul(mat[0][0], mat[1][1]), cMul(mat[0][1], mat[1][0]));
    }

    let det = complex(0, 0);
    let sign = 1;
    for (let f = 0; f < n; f++) {
        const minor = getMinor(mat, 0, f);
        const subDet = determinant(minor);
        const term = cMul(complex(sign, 0), cMul(mat[0][f], subDet));
        det = cAdd(det, term);
        sign = -sign;
    }
    return det;
}

function cofactorMatrix(mat) {
    const n = mat.length;
    const cof = createMatrix(n, n);
    if (n === 1) {
        cof[0][0] = complex(1, 0);
        return cof;
    }
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const minor = getMinor(mat, i, j);
            const sign = ((i + j) % 2 === 0) ? 1 : -1;
            cof[i][j] = cMul(complex(sign, 0), determinant(minor));
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
            adj[j][i] = complex(cof[i][j]);
        }
    }
    return adj;
}

function inverseMatrix(mat) {
    const n = mat.length;
    const det = determinant(mat);
    if (cAbs(det) < EPS) return null; // Singular matrix
    const adj = adjointMatrix(mat);
    const inv = createMatrix(n, n);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            inv[i][j] = cDiv(adj[i][j], det);
        }
    }
    return inv;
}

function traceMatrix(mat) {
    const n = mat.length;
    let t = complex(0, 0);
    for (let i = 0; i < n; i++) {
        t = cAdd(t, mat[i][i]);
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
            if (cAbs(mat[r][col]) > best) {
                best = cAbs(mat[r][col]);
                pivot = r;
            }
        }
        if (pivot === -1) continue;

        // Swap pivot row
        for (let c = 0; c < cols; c++) {
            const tmp = complex(mat[rank][c]);
            mat[rank][c] = complex(mat[pivot][c]);
            mat[pivot][c] = tmp;
        }

        // Eliminate below
        for (let r = rank + 1; r < rows; r++) {
            const factor = cDiv(mat[r][col], mat[rank][col]);
            for (let c = col; c < cols; c++) {
                mat[r][c] = cSub(mat[r][c], cMul(factor, mat[rank][c]));
            }
        }
        rank++;
    }
    return { rref: mat, rank };
}

function luDecompose(mat) {
    const n = mat.length;
    const L = createMatrix(n, n, 0);
    const U = createMatrix(n, n, 0);

    for (let i = 0; i < n; i++) {
        for (let k = i; k < n; k++) {
            let sum = complex(0, 0);
            for (let j = 0; j < i; j++) {
                sum = cAdd(sum, cMul(L[i][j], U[j][k]));
            }
            U[i][k] = cSub(mat[i][k], sum);
        }
        if (cAbs(U[i][i]) < EPS) return null; // Zero pivot encountered

        for (let k = i; k < n; k++) {
            if (i === k) {
                L[i][i] = complex(1, 0);
            } else {
                let sum = complex(0, 0);
                for (let j = 0; j < i; j++) {
                    sum = cAdd(sum, cMul(L[k][j], U[j][i]));
                }
                L[k][i] = cDiv(cSub(mat[k][i], sum), U[i][i]);
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
            aug[i][j] = complex(A[i][j]);
        }
        aug[i][n] = complex(b[i]);
    }

    for (let i = 0; i < n; i++) {
        let pivot = i;
        let best = cAbs(aug[i][i]);
        for (let k = i + 1; k < n; k++) {
            if (cAbs(aug[k][i]) > best) {
                best = cAbs(aug[k][i]);
                pivot = k;
            }
        }
        if (best < EPS) return null; // Singular matrix

        for (let c = 0; c <= n; c++) {
            const tmp = complex(aug[i][c]);
            aug[i][c] = complex(aug[pivot][c]);
            aug[pivot][c] = tmp;
        }

        for (let k = i + 1; k < n; k++) {
            const factor = cDiv(aug[k][i], aug[i][i]);
            for (let c = i; c <= n; c++) {
                aug[k][c] = cSub(aug[k][c], cMul(factor, aug[i][c]));
            }
        }
    }

    // Back substitution
    const x = new Array(n).fill(0).map(() => complex(0, 0));
    for (let i = n - 1; i >= 0; i--) {
        let sum = complex(aug[i][n]);
        for (let j = i + 1; j < n; j++) {
            sum = cSub(sum, cMul(aug[i][j], x[j]));
        }
        x[i] = cDiv(sum, aug[i][i]);
    }
    return x;
}

/* =========================================================
   EIGENVALUES (2x2 and 3x3) - Complex Cardano's Formula
   ========================================================= */

function eigen2x2(mat) {
    const a = complex(mat[0][0]), b = complex(mat[0][1]);
    const c = complex(mat[1][0]), d = complex(mat[1][1]);
    const tr = cAdd(a, d);
    const det = cSub(cMul(a, d), cMul(b, c));
    const disc = cSub(cMul(tr, tr), cMul(complex(4, 0), det));
    const sq = cSqrt(disc);

    return [
        cDiv(cAdd(tr, sq), complex(2, 0)),
        cDiv(cSub(tr, sq), complex(2, 0))
    ];
}

function solveCubicComplex(b1, b2, b3) {
    b1 = complex(b1); b2 = complex(b2); b3 = complex(b3);
    
    // p = b2 - b1^2 / 3
    const p = cSub(b2, cDiv(cMul(b1, b1), complex(3, 0)));
    
    // q = 2*b1^3 / 27 - b1*b2 / 3 + b3
    const qTerm1 = cDiv(cMul(complex(2, 0), cMul(b1, cMul(b1, b1))), complex(27, 0));
    const qTerm2 = cDiv(cMul(b1, b2), complex(3, 0));
    const q = cAdd(cSub(qTerm1, qTerm2), b3);
    
    const shift = cDiv(b1, complex(3, 0));
    
    // delta = (q/2)^2 + (p/3)^3
    const q2 = cDiv(q, complex(2, 0));
    const p3 = cDiv(p, complex(3, 0));
    const delta = cAdd(cMul(q2, q2), cMul(p3, cMul(p3, p3)));
    const sq = cSqrt(delta);

    const termA = cAdd(cMul(complex(-1, 0), q2), sq);
    const A = cPow(termA, 1 / 3);

    let B;
    if (cAbs(A) > 1e-12) {
        B = cDiv(cMul(complex(-1, 0), p), cMul(complex(3, 0), A));
    } else {
        const termB = cSub(cMul(complex(-1, 0), q2), sq);
        B = cPow(termB, 1 / 3);
    }

    const w = complex(-0.5, Math.sqrt(3.0) / 2.0); // primitive cube root of unity
    const w2 = cConj(w);

    const r0 = cSub(cAdd(A, B), shift);
    const r1 = cSub(cAdd(cMul(w, A), cMul(w2, B)), shift);
    const r2 = cSub(cAdd(cMul(w2, A), cMul(w, B)), shift);

    return [r0, r1, r2];
}

function eigen3x3(mat) {
    const T = traceMatrix(mat);
    const M2 = cAdd(
        cAdd(
            cSub(cMul(mat[0][0], mat[1][1]), cMul(mat[0][1], mat[1][0])),
            cSub(cMul(mat[0][0], mat[2][2]), cMul(mat[0][2], mat[2][0]))
        ),
        cSub(cMul(mat[1][1], mat[2][2]), cMul(mat[1][2], mat[2][1]))
    );
    const D = determinant(mat);

    const negT = cMul(complex(-1, 0), T);
    const negD = cMul(complex(-1, 0), D);

    return solveCubicComplex(negT, M2, negD);
}

// Module export for Node.js / Browser compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EPS,
        complex,
        parseComplex,
        formatComplex,
        cAdd, cSub, cMul, cDiv, cAbs, cSqrt, cPow, cConj,
        saveLastResult, getLastResult, createMatrix, copyMatrix, printMatrix,
        addMatrices, subtractMatrices, multiplyMatrices, scalarMultiply,
        transposeMatrix, identityMatrix, compareMatrices, matrixPower,
        getMinor, determinant, cofactorMatrix, adjointMatrix, inverseMatrix,
        traceMatrix, gaussianEliminate, luDecompose, solveLinearSystem,
        eigen2x2, solveCubicComplex, eigen3x3
    };
}
