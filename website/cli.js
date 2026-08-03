const readline = require('readline');
const Matrix = require('./matrix.js');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise((resolve) => rl.question(query, resolve));
}

async function askNumbers(promptText) {
    const answer = await askQuestion(promptText);
    const nums = answer.trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
    return nums;
}

async function readMatrixInput(rows, cols) {
    console.log(`Enter ${rows * cols} elements (row by row, space or newline separated):`);
    const mat = Matrix.createMatrix(rows, cols);
    let values = [];
    while (values.length < rows * cols) {
        const line = await askQuestion("");
        const parsed = line.trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
        values = values.concat(parsed);
    }

    let idx = 0;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            mat[i][j] = values[idx++];
        }
    }
    return mat;
}

async function getMatrixInput(rows, cols, label) {
    const lastRes = Matrix.getLastResult();
    if (lastRes.hasResult && lastRes.rows === rows && lastRes.cols === cols) {
        const choice = await askQuestion(`A previous result (${rows}x${cols}) is available. Use it as ${label}? (1=yes, 0=no): `);
        if (parseInt(choice.trim(), 10) === 1) {
            console.log(`${label} (reused):`);
            console.log(Matrix.printMatrix(lastRes.matrix));
            return Matrix.copyMatrix(lastRes.matrix);
        }
    }
    console.log(`${label}:`);
    return await readMatrixInput(rows, cols);
}

async function main() {
    let again = 1;

    do {
        console.log("\n=== Matrix Operations ===");
        console.log(" 1. Add two matrices");
        console.log(" 2. Multiply two matrices");
        console.log(" 3. Transpose a matrix");
        console.log(" 4. Subtract two matrices");
        console.log(" 5. Scalar multiplication");
        console.log(" 6. Generate identity matrix");
        console.log(" 7. Compare two matrices");
        console.log(" 8. Determinant");
        console.log(" 9. Inverse of a matrix");
        console.log("10. Matrix rank");
        console.log("11. Trace");
        console.log("12. Adjoint");
        console.log("13. Cofactor matrix");
        console.log("14. Gaussian elimination");
        console.log("15. LU decomposition");
        console.log("16. Matrix exponentiation");
        console.log("17. Solve system Ax = b");
        console.log("18. Eigenvalues (2x2 or 3x3)");
        
        const choiceStr = await askQuestion("Enter choice: ");
        const choice = parseInt(choiceStr.trim(), 10);

        try {
            switch (choice) {
                case 1: {
                    const countArr = await askNumbers("How many matrices do you want to add (2 or more)? ");
                    const count = countArr[0] || 2;
                    const dim = await askNumbers("Enter rows and columns (all matrices must match): ");
                    const rowsA = dim[0], colsA = dim[1];

                    let result = await getMatrixInput(rowsA, colsA, "Matrix 1");
                    for (let m = 2; m <= count; m++) {
                        const b = await getMatrixInput(rowsA, colsA, `Matrix ${m}`);
                        result = Matrix.addMatrices(result, b);
                        console.log(`\nRunning total after Matrix ${m}:`);
                        console.log(Matrix.printMatrix(result));
                    }
                    console.log(`\nFinal Result (sum of ${count} matrices):`);
                    console.log(Matrix.printMatrix(result));
                    Matrix.saveLastResult(result);
                    break;
                }

                case 2: {
                    const countArr = await askNumbers("How many matrices do you want to multiply (2 or more)? ");
                    const count = countArr[0] || 2;
                    const dim1 = await askNumbers("Enter rows and columns of Matrix 1: ");
                    let curRows = dim1[0], curCols = dim1[1];
                    let result = await getMatrixInput(curRows, curCols, "Matrix 1");

                    let ok = true;
                    for (let m = 2; m <= count; m++) {
                        const dimM = await askNumbers(`Enter rows and columns of Matrix ${m}: `);
                        const rowsB = dimM[0], colsB = dimM[1];
                        if (curCols !== rowsB) {
                            console.log(`Error: columns of running result (${curCols}) must equal rows of Matrix ${m} (${rowsB}).`);
                            ok = false;
                            break;
                        }
                        const b = await getMatrixInput(rowsB, colsB, `Matrix ${m}`);
                        result = Matrix.multiplyMatrices(result, b);
                        curCols = colsB;
                        console.log(`\nRunning product after Matrix ${m}:`);
                        console.log(Matrix.printMatrix(result));
                    }
                    if (ok) {
                        console.log(`\nFinal Result (product of ${count} matrices):`);
                        console.log(Matrix.printMatrix(result));
                        Matrix.saveLastResult(result);
                    }
                    break;
                }

                case 3: {
                    const dim = await askNumbers("Enter rows and columns of the matrix: ");
                    const a = await getMatrixInput(dim[0], dim[1], "Matrix");
                    const res = Matrix.transposeMatrix(a);
                    console.log("\nTransposed Matrix:");
                    console.log(Matrix.printMatrix(res));
                    Matrix.saveLastResult(res);
                    break;
                }

                case 4: {
                    const countArr = await askNumbers("How many matrices do you want to subtract (2 or more)? ");
                    const count = countArr[0] || 2;
                    const dim = await askNumbers("Enter rows and columns (all matrices must match): ");
                    const rowsA = dim[0], colsA = dim[1];

                    let result = await getMatrixInput(rowsA, colsA, "Matrix 1");
                    for (let m = 2; m <= count; m++) {
                        const b = await getMatrixInput(rowsA, colsA, `Matrix ${m}`);
                        result = Matrix.subtractMatrices(result, b);
                        console.log(`\nRunning result after subtracting Matrix ${m}:`);
                        console.log(Matrix.printMatrix(result));
                    }
                    console.log(`\nFinal Result (Matrix1 - Matrix2 - ... - Matrix${count}):`);
                    console.log(Matrix.printMatrix(result));
                    Matrix.saveLastResult(result);
                    break;
                }

                case 5: {
                    const dim = await askNumbers("Enter rows and columns of the matrix: ");
                    const a = await getMatrixInput(dim[0], dim[1], "Matrix");
                    const sArr = await askNumbers("Enter scalar value: ");
                    const scalar = sArr[0];
                    const res = Matrix.scalarMultiply(a, scalar);
                    console.log(`\nResult (${scalar} x Matrix):`);
                    console.log(Matrix.printMatrix(res));
                    Matrix.saveLastResult(res);
                    break;
                }

                case 6: {
                    const nArr = await askNumbers("Enter size n for the n x n identity matrix: ");
                    const n = nArr[0];
                    const res = Matrix.identityMatrix(n);
                    console.log("\nIdentity Matrix:");
                    console.log(Matrix.printMatrix(res));
                    Matrix.saveLastResult(res);
                    break;
                }

                case 7: {
                    const countArr = await askNumbers("How many matrices do you want to compare (2 or more)? ");
                    const count = countArr[0] || 2;
                    const dim = await askNumbers("Enter rows and columns (all matrices must match): ");
                    const rowsA = dim[0], colsA = dim[1];

                    const a = await getMatrixInput(rowsA, colsA, "Matrix 1");
                    let allEqual = true;
                    for (let m = 2; m <= count; m++) {
                        const b = await getMatrixInput(rowsA, colsA, `Matrix ${m}`);
                        if (!Matrix.compareMatrices(a, b)) {
                            console.log(`Matrix 1 and Matrix ${m} are NOT equal.`);
                            allEqual = false;
                        }
                    }
                    if (allEqual) console.log(`\nAll ${count} matrices are EQUAL.`);
                    else console.log(`\nThe matrices are NOT all equal.`);
                    break;
                }

                case 8: {
                    const nArr = await askNumbers("Enter size n for the n x n matrix: ");
                    const n = nArr[0];
                    const a = await getMatrixInput(n, n, "Matrix");
                    const det = Matrix.determinant(a);
                    console.log(`\nDeterminant = ${det.toFixed(4)}`);
                    break;
                }

                case 9: {
                    const nArr = await askNumbers("Enter size n for the n x n matrix: ");
                    const n = nArr[0];
                    const a = await getMatrixInput(n, n, "Matrix");
                    const inv = Matrix.inverseMatrix(a);
                    if (inv) {
                        console.log("\nInverse Matrix:");
                        console.log(Matrix.printMatrix(inv));
                        Matrix.saveLastResult(inv);
                    } else {
                        console.log("\nMatrix is singular; inverse does not exist.");
                    }
                    break;
                }

                case 10: {
                    const dim = await askNumbers("Enter rows and columns of the matrix: ");
                    const a = await getMatrixInput(dim[0], dim[1], "Matrix");
                    const { rank } = Matrix.gaussianEliminate(a);
                    console.log(`\nRank = ${rank}`);
                    break;
                }

                case 11: {
                    const nArr = await askNumbers("Enter size n for the n x n matrix: ");
                    const n = nArr[0];
                    const a = await getMatrixInput(n, n, "Matrix");
                    console.log(`\nTrace = ${Matrix.traceMatrix(a).toFixed(4)}`);
                    break;
                }

                case 12: {
                    const nArr = await askNumbers("Enter size n for the n x n matrix: ");
                    const n = nArr[0];
                    const a = await getMatrixInput(n, n, "Matrix");
                    const adj = Matrix.adjointMatrix(a);
                    console.log("\nAdjoint Matrix:");
                    console.log(Matrix.printMatrix(adj));
                    Matrix.saveLastResult(adj);
                    break;
                }

                case 13: {
                    const nArr = await askNumbers("Enter size n for the n x n matrix: ");
                    const n = nArr[0];
                    const a = await getMatrixInput(n, n, "Matrix");
                    const cof = Matrix.cofactorMatrix(a);
                    console.log("\nCofactor Matrix:");
                    console.log(Matrix.printMatrix(cof));
                    Matrix.saveLastResult(cof);
                    break;
                }

                case 14: {
                    const dim = await askNumbers("Enter rows and columns of the matrix: ");
                    const a = await getMatrixInput(dim[0], dim[1], "Matrix");
                    const { rref, rank } = Matrix.gaussianEliminate(a);
                    console.log("\nRow-Echelon Form:");
                    console.log(Matrix.printMatrix(rref));
                    console.log(`Rank = ${rank}`);
                    Matrix.saveLastResult(rref);
                    break;
                }

                case 15: {
                    const nArr = await askNumbers("Enter size n for the n x n matrix: ");
                    const n = nArr[0];
                    const a = await getMatrixInput(n, n, "Matrix");
                    const lu = Matrix.luDecompose(a);
                    if (lu) {
                        console.log("\nLower Triangular (L):");
                        console.log(Matrix.printMatrix(lu.L));
                        console.log("\nUpper Triangular (U):");
                        console.log(Matrix.printMatrix(lu.U));
                        Matrix.saveLastResult(lu.U);
                    } else {
                        console.log("\nLU decomposition without pivoting failed (zero pivot encountered).");
                    }
                    break;
                }

                case 16: {
                    const nArr = await askNumbers("Enter size n for the n x n matrix: ");
                    const n = nArr[0];
                    const a = await getMatrixInput(n, n, "Matrix");
                    const pArr = await askNumbers("Enter non-negative integer power p: ");
                    const p = pArr[0];
                    if (p < 0) {
                        console.log("Negative powers are not supported.");
                        break;
                    }
                    const res = Matrix.matrixPower(a, p);
                    console.log(`\nResult (Matrix^${p}):`);
                    console.log(Matrix.printMatrix(res));
                    Matrix.saveLastResult(res);
                    break;
                }

                case 17: {
                    const nArr = await askNumbers("Enter size n (system of n equations, n unknowns): ");
                    const n = nArr[0];
                    const A = await getMatrixInput(n, n, "Matrix A");
                    console.log(`Vector b (${n} values):`);
                    const b = await askNumbers("");
                    const x = Matrix.solveLinearSystem(A, b);
                    if (x) {
                        console.log("\nSolution x:");
                        x.forEach((val, idx) => console.log(`x${idx + 1} = ${val.toFixed(4)}`));
                        const colVec = x.map(val => [val]);
                        Matrix.saveLastResult(colVec);
                    } else {
                        console.log("\nThe system has no unique solution (singular matrix).");
                    }
                    break;
                }

                case 18: {
                    const nArr = await askNumbers("Enter size n (2 or 3 only): ");
                    const n = nArr[0];
                    if (n !== 2 && n !== 3) {
                        console.log("Eigenvalue computation only supported for 2x2 and 3x3 matrices.");
                        break;
                    }
                    const a = await getMatrixInput(n, n, "Matrix");
                    console.log("\nEigenvalues:");
                    const evs = (n === 2) ? Matrix.eigen2x2(a) : Matrix.eigen3x3(a);
                    evs.forEach((e) => {
                        if (Math.abs(e.im) < Matrix.EPS) {
                            console.log(`  ${e.re.toFixed(4)}${e.repeated ? ' (repeated)' : ''}`);
                        } else {
                            const sign = e.im >= 0 ? '+' : '-';
                            console.log(`  ${e.re.toFixed(4)} ${sign} ${Math.abs(e.im).toFixed(4)}i`);
                        }
                    });
                    break;
                }

                default:
                    console.log("Invalid choice.");
            }
        } catch (err) {
            console.log("Error:", err.message);
        }

        const againStr = await askQuestion("\nRun another operation? (1 = yes, 0 = no): ");
        again = parseInt(againStr.trim(), 10);
    } while (again === 1);

    console.log("Goodbye!");
    rl.close();
}

if (require.main === module) {
    main();
}
