#include <stdio.h>
#include <math.h>
#define MAX_SIZE 10
#define EPS 1e-9

/* =========================================================
   GLOBAL "LAST RESULT" MEMORY
   Lets the previous operation's output be reused as input
   for the next operation, instead of retyping every value.
   ========================================================= */
double last_result[MAX_SIZE][MAX_SIZE];
int last_rows = 0, last_cols = 0;
int has_last_result = 0;

void save_last_result(double mat[MAX_SIZE][MAX_SIZE], int rows, int cols) {
    for (int i = 0; i < rows; i++)
        for (int j = 0; j < cols; j++)
            last_result[i][j] = mat[i][j];
    last_rows = rows;
    last_cols = cols;
    has_last_result = 1;
}

/* =========================================================
   CORE MATRIX I/O (everything is double now)
   ========================================================= */

void read_matrix(double mat[MAX_SIZE][MAX_SIZE], int rows, int cols) {
    printf("Enter %d elements (row by row):\n", rows * cols);
    for (int i = 0; i < rows; i++)
        for (int j = 0; j < cols; j++)
            scanf("%lf", &mat[i][j]);
}

// Prints integers cleanly (no trailing .000), decimals with 3 places
void print_matrix(double mat[MAX_SIZE][MAX_SIZE], int rows, int cols) {
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            double v = mat[i][j];
            if (fabs(v - round(v)) < 1e-9)
                printf("%9.0f ", v);
            else
                printf("%9.3f ", v);
        }
        printf("\n");
    }
}

// Offers to reuse the previous result if its dimensions match what's needed;
// otherwise falls back to manual entry.
void get_matrix_input(double mat[MAX_SIZE][MAX_SIZE], int rows, int cols, const char *label) {
    if (has_last_result && last_rows == rows && last_cols == cols) {
        printf("A previous result (%dx%d) is available. Use it as %s? (1=yes, 0=no): ",
               rows, cols, label);
        int choice;
        scanf("%d", &choice);
        if (choice == 1) {
            for (int i = 0; i < rows; i++)
                for (int j = 0; j < cols; j++)
                    mat[i][j] = last_result[i][j];
            printf("%s (reused):\n", label);
            print_matrix(mat, rows, cols);
            return;
        }
    }
    printf("%s:\n", label);
    read_matrix(mat, rows, cols);
}

void copy_matrix(double src[MAX_SIZE][MAX_SIZE], double dst[MAX_SIZE][MAX_SIZE], int rows, int cols) {
    for (int i = 0; i < rows; i++)
        for (int j = 0; j < cols; j++)
            dst[i][j] = src[i][j];
}

/* =========================================================
   BASIC OPERATIONS
   ========================================================= */

void add_matrices(double a[MAX_SIZE][MAX_SIZE], double b[MAX_SIZE][MAX_SIZE],
                   double result[MAX_SIZE][MAX_SIZE], int rows, int cols) {
    for (int i = 0; i < rows; i++)
        for (int j = 0; j < cols; j++)
            result[i][j] = a[i][j] + b[i][j];
}

void subtract_matrices(double a[MAX_SIZE][MAX_SIZE], double b[MAX_SIZE][MAX_SIZE],
                        double result[MAX_SIZE][MAX_SIZE], int rows, int cols) {
    for (int i = 0; i < rows; i++)
        for (int j = 0; j < cols; j++)
            result[i][j] = a[i][j] - b[i][j];
}

void multiply_matrices(double a[MAX_SIZE][MAX_SIZE], double b[MAX_SIZE][MAX_SIZE],
                        double result[MAX_SIZE][MAX_SIZE],
                        int rowsA, int colsA, int colsB) {
    for (int i = 0; i < rowsA; i++)
        for (int j = 0; j < colsB; j++) {
            result[i][j] = 0.0;
            for (int k = 0; k < colsA; k++)
                result[i][j] += a[i][k] * b[k][j];
        }
}

void scalar_multiply(double mat[MAX_SIZE][MAX_SIZE], double result[MAX_SIZE][MAX_SIZE],
                      int rows, int cols, double scalar) {
    for (int i = 0; i < rows; i++)
        for (int j = 0; j < cols; j++)
            result[i][j] = mat[i][j] * scalar;
}

void transpose_matrix(double mat[MAX_SIZE][MAX_SIZE], double result[MAX_SIZE][MAX_SIZE],
                       int rows, int cols) {
    for (int i = 0; i < rows; i++)
        for (int j = 0; j < cols; j++)
            result[j][i] = mat[i][j];
}

void identity_matrix(double mat[MAX_SIZE][MAX_SIZE], int n) {
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            mat[i][j] = (i == j) ? 1.0 : 0.0;
}

int compare_matrices(double a[MAX_SIZE][MAX_SIZE], double b[MAX_SIZE][MAX_SIZE],
                      int rows, int cols) {
    for (int i = 0; i < rows; i++)
        for (int j = 0; j < cols; j++)
            if (fabs(a[i][j] - b[i][j]) > EPS)
                return 0;
    return 1;
}

// Fast exponentiation: result = mat^p  (n x n square matrix, p >= 0)
void matrix_power(double mat[MAX_SIZE][MAX_SIZE], double result[MAX_SIZE][MAX_SIZE], int n, int p) {
    double base[MAX_SIZE][MAX_SIZE], temp[MAX_SIZE][MAX_SIZE];
    copy_matrix(mat, base, n, n);
    identity_matrix(result, n);
    while (p > 0) {
        if (p % 2 == 1) {
            multiply_matrices(result, base, temp, n, n, n);
            copy_matrix(temp, result, n, n);
        }
        multiply_matrices(base, base, temp, n, n, n);
        copy_matrix(temp, base, n, n);
        p /= 2;
    }
}

/* =========================================================
   DETERMINANT / INVERSE / ADJOINT / COFACTOR
   ========================================================= */

void get_minor(double mat[MAX_SIZE][MAX_SIZE], double minor[MAX_SIZE][MAX_SIZE],
                int p, int q, int n) {
    int mi = 0;
    for (int i = 0; i < n; i++) {
        if (i == p) continue;
        int mj = 0;
        for (int j = 0; j < n; j++) {
            if (j == q) continue;
            minor[mi][mj] = mat[i][j];
            mj++;
        }
        mi++;
    }
}

double determinant(double mat[MAX_SIZE][MAX_SIZE], int n) {
    if (n == 1) return mat[0][0];
    if (n == 2) return mat[0][0] * mat[1][1] - mat[0][1] * mat[1][0];

    double det = 0.0, minor[MAX_SIZE][MAX_SIZE];
    int sign = 1;
    for (int f = 0; f < n; f++) {
        get_minor(mat, minor, 0, f, n);
        det += sign * mat[0][f] * determinant(minor, n - 1);
        sign = -sign;
    }
    return det;
}

void cofactor_matrix(double mat[MAX_SIZE][MAX_SIZE], double cof[MAX_SIZE][MAX_SIZE], int n) {
    if (n == 1) { cof[0][0] = 1.0; return; }
    double minor[MAX_SIZE][MAX_SIZE];
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            get_minor(mat, minor, i, j, n);
            int sign = ((i + j) % 2 == 0) ? 1 : -1;
            cof[i][j] = sign * determinant(minor, n - 1);
        }
    }
}

void adjoint_matrix(double mat[MAX_SIZE][MAX_SIZE], double adj[MAX_SIZE][MAX_SIZE], int n) {
    if (n == 1) { adj[0][0] = 1.0; return; }
    double cof[MAX_SIZE][MAX_SIZE];
    cofactor_matrix(mat, cof, n);
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            adj[j][i] = cof[i][j];
}

int inverse_matrix(double mat[MAX_SIZE][MAX_SIZE], double inv[MAX_SIZE][MAX_SIZE], int n) {
    double det = determinant(mat, n);
    if (fabs(det) < EPS) return 0;
    double adj[MAX_SIZE][MAX_SIZE];
    adjoint_matrix(mat, adj, n);
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            inv[i][j] = adj[i][j] / det;
    return 1;
}

double trace_matrix(double mat[MAX_SIZE][MAX_SIZE], int n) {
    double t = 0.0;
    for (int i = 0; i < n; i++) t += mat[i][i];
    return t;
}

/* =========================================================
   RANK / GAUSSIAN ELIMINATION / LU / LINEAR SOLVE
   ========================================================= */

int gaussian_eliminate(double mat[MAX_SIZE][MAX_SIZE], int rows, int cols) {
    int rank = 0;
    for (int col = 0; col < cols && rank < rows; col++) {
        int pivot = -1;
        double best = EPS;
        for (int r = rank; r < rows; r++)
            if (fabs(mat[r][col]) > best) { best = fabs(mat[r][col]); pivot = r; }
        if (pivot == -1) continue;

        for (int c = 0; c < cols; c++) {
            double tmp = mat[rank][c];
            mat[rank][c] = mat[pivot][c];
            mat[pivot][c] = tmp;
        }
        for (int r = rank + 1; r < rows; r++) {
            double factor = mat[r][col] / mat[rank][col];
            for (int c = col; c < cols; c++)
                mat[r][c] -= factor * mat[rank][c];
        }
        rank++;
    }
    return rank;
}

int lu_decompose(double mat[MAX_SIZE][MAX_SIZE], double L[MAX_SIZE][MAX_SIZE],
                  double U[MAX_SIZE][MAX_SIZE], int n) {
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++) { L[i][j] = 0.0; U[i][j] = 0.0; }

    for (int i = 0; i < n; i++) {
        for (int k = i; k < n; k++) {
            double sum = 0.0;
            for (int j = 0; j < i; j++) sum += L[i][j] * U[j][k];
            U[i][k] = mat[i][k] - sum;
        }
        if (fabs(U[i][i]) < EPS) return 0;

        for (int k = i; k < n; k++) {
            if (i == k) {
                L[i][i] = 1.0;
            } else {
                double sum = 0.0;
                for (int j = 0; j < i; j++) sum += L[k][j] * U[j][i];
                L[k][i] = (mat[k][i] - sum) / U[i][i];
            }
        }
    }
    return 1;
}

int solve_linear_system(double A[MAX_SIZE][MAX_SIZE], double b[MAX_SIZE],
                         double x[MAX_SIZE], int n) {
    double aug[MAX_SIZE][MAX_SIZE + 1];
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) aug[i][j] = A[i][j];
        aug[i][n] = b[i];
    }

    for (int i = 0; i < n; i++) {
        int pivot = i;
        double best = fabs(aug[i][i]);
        for (int k = i + 1; k < n; k++)
            if (fabs(aug[k][i]) > best) { best = fabs(aug[k][i]); pivot = k; }
        if (best < EPS) return 0;

        for (int c = 0; c <= n; c++) {
            double tmp = aug[i][c];
            aug[i][c] = aug[pivot][c];
            aug[pivot][c] = tmp;
        }
        for (int k = i + 1; k < n; k++) {
            double factor = aug[k][i] / aug[i][i];
            for (int c = i; c <= n; c++)
                aug[k][c] -= factor * aug[i][c];
        }
    }

    for (int i = n - 1; i >= 0; i--) {
        double sum = aug[i][n];
        for (int j = i + 1; j < n; j++) sum -= aug[i][j] * x[j];
        x[i] = sum / aug[i][i];
    }
    return 1;
}

/* =========================================================
   EIGENVALUES (2x2 and 3x3)
   ========================================================= */

void eigen_2x2(double mat[MAX_SIZE][MAX_SIZE]) {
    double a = mat[0][0], b = mat[0][1], c = mat[1][0], d = mat[1][1];
    double tr = a + d, det = a * d - b * c;
    double disc = tr * tr - 4 * det;

    if (disc >= 0) {
        double sq = sqrt(disc);
        printf("Eigenvalues: %.4f, %.4f\n", (tr + sq) / 2, (tr - sq) / 2);
    } else {
        double re = tr / 2, im = sqrt(-disc) / 2;
        printf("Eigenvalues: %.4f + %.4fi, %.4f - %.4fi\n", re, im, re, im);
    }
}

void solve_cubic(double B, double C, double D) {
    double p = C - B * B / 3.0;
    double q = 2 * B * B * B / 27.0 - B * C / 3.0 + D;
    double disc = (q * q) / 4.0 + (p * p * p) / 27.0;
    double shift = B / 3.0;

    if (disc > EPS) {
        double sq = sqrt(disc);
        double u = cbrt(-q / 2.0 + sq);
        double v = cbrt(-q / 2.0 - sq);
        double x1 = u + v - shift;
        double re = -(u + v) / 2.0 - shift;
        double im = (sqrt(3.0) / 2.0) * (u - v);
        printf("Eigenvalues: %.4f, %.4f + %.4fi, %.4f - %.4fi\n", x1, re, im, re, im);
    } else if (fabs(disc) <= EPS) {
        double u = cbrt(-q / 2.0);
        double x1 = 2 * u - shift;
        double x2 = -u - shift;
        printf("Eigenvalues: %.4f, %.4f, %.4f (repeated)\n", x1, x2, x2);
    } else {
        double r = sqrt(-p * p * p / 27.0);
        double phi = acos(-q / (2.0 * r));
        double m = 2.0 * sqrt(-p / 3.0);
        double x1 = m * cos(phi / 3.0) - shift;
        double x2 = m * cos((phi + 2 * M_PI) / 3.0) - shift;
        double x3 = m * cos((phi + 4 * M_PI) / 3.0) - shift;
        printf("Eigenvalues: %.4f, %.4f, %.4f\n", x1, x2, x3);
    }
}

void eigen_3x3(double mat[MAX_SIZE][MAX_SIZE]) {
    double T = trace_matrix(mat, 3);
    double M2 = (mat[0][0] * mat[1][1] - mat[0][1] * mat[1][0])
              + (mat[0][0] * mat[2][2] - mat[0][2] * mat[2][0])
              + (mat[1][1] * mat[2][2] - mat[1][2] * mat[2][1]);
    double D = determinant(mat, 3);
    solve_cubic(-T, M2, -D);
}

/* =========================================================
   MAIN
   ========================================================= */

int main() {
    double a[MAX_SIZE][MAX_SIZE], b[MAX_SIZE][MAX_SIZE], result[MAX_SIZE][MAX_SIZE];
    int rowsA, colsA, rowsB, colsB;
    int choice, again;

    do {
        printf("\n=== Matrix Operations ===\n");
        printf(" 1. Add two matrices\n");
        printf(" 2. Multiply two matrices\n");
        printf(" 3. Transpose a matrix\n");
        printf(" 4. Subtract two matrices\n");
        printf(" 5. Scalar multiplication\n");
        printf(" 6. Generate identity matrix\n");
        printf(" 7. Compare two matrices\n");
        printf(" 8. Determinant\n");
        printf(" 9. Inverse of a matrix\n");
        printf("10. Matrix rank\n");
        printf("11. Trace\n");
        printf("12. Adjoint\n");
        printf("13. Cofactor matrix\n");
        printf("14. Gaussian elimination\n");
        printf("15. LU decomposition\n");
        printf("16. Matrix exponentiation\n");
        printf("17. Solve system Ax = b\n");
        printf("18. Eigenvalues (2x2 or 3x3)\n");
        printf("Enter choice: ");
        scanf("%d", &choice);

        switch (choice) {
            case 1:
                printf("Enter rows and columns for both matrices (must match): ");
                scanf("%d %d", &rowsA, &colsA);
                rowsB = rowsA; colsB = colsA;
                get_matrix_input(a, rowsA, colsA, "Matrix A");
                get_matrix_input(b, rowsB, colsB, "Matrix B");
                add_matrices(a, b, result, rowsA, colsA);
                printf("\nResult (A + B):\n");
                print_matrix(result, rowsA, colsA);
                save_last_result(result, rowsA, colsA);
                break;

            case 2:
                printf("Enter rows and columns of Matrix A: ");
                scanf("%d %d", &rowsA, &colsA);
                printf("Enter rows and columns of Matrix B: ");
                scanf("%d %d", &rowsB, &colsB);
                if (colsA != rowsB) {
                    printf("Error: columns of A must equal rows of B for multiplication.\n");
                    break;
                }
                get_matrix_input(a, rowsA, colsA, "Matrix A");
                get_matrix_input(b, rowsB, colsB, "Matrix B");
                multiply_matrices(a, b, result, rowsA, colsA, colsB);
                printf("\nResult (A x B):\n");
                print_matrix(result, rowsA, colsB);
                save_last_result(result, rowsA, colsB);
                break;

            case 3:
                printf("Enter rows and columns of the matrix: ");
                scanf("%d %d", &rowsA, &colsA);
                get_matrix_input(a, rowsA, colsA, "Matrix");
                transpose_matrix(a, result, rowsA, colsA);
                printf("\nTransposed Matrix:\n");
                print_matrix(result, colsA, rowsA);
                save_last_result(result, colsA, rowsA);
                break;

            case 4:
                printf("Enter rows and columns for both matrices (must match): ");
                scanf("%d %d", &rowsA, &colsA);
                rowsB = rowsA; colsB = colsA;
                get_matrix_input(a, rowsA, colsA, "Matrix A");
                get_matrix_input(b, rowsB, colsB, "Matrix B");
                subtract_matrices(a, b, result, rowsA, colsA);
                printf("\nResult (A - B):\n");
                print_matrix(result, rowsA, colsA);
                save_last_result(result, rowsA, colsA);
                break;

            case 5: {
                double scalar;
                printf("Enter rows and columns of the matrix: ");
                scanf("%d %d", &rowsA, &colsA);
                get_matrix_input(a, rowsA, colsA, "Matrix");
                printf("Enter scalar value: ");
                scanf("%lf", &scalar);
                scalar_multiply(a, result, rowsA, colsA, scalar);
                printf("\nResult (%.3g x Matrix):\n", scalar);
                print_matrix(result, rowsA, colsA);
                save_last_result(result, rowsA, colsA);
                break;
            }

            case 6: {
                int n;
                printf("Enter size n for the n x n identity matrix: ");
                scanf("%d", &n);
                identity_matrix(result, n);
                printf("\nIdentity Matrix:\n");
                print_matrix(result, n, n);
                save_last_result(result, n, n);
                break;
            }

            case 7:
                printf("Enter rows and columns for both matrices (must match): ");
                scanf("%d %d", &rowsA, &colsA);
                rowsB = rowsA; colsB = colsA;
                get_matrix_input(a, rowsA, colsA, "Matrix A");
                get_matrix_input(b, rowsB, colsB, "Matrix B");
                if (compare_matrices(a, b, rowsA, colsA))
                    printf("\nThe matrices are EQUAL.\n");
                else
                    printf("\nThe matrices are NOT equal.\n");
                break;

            case 8: {
                int n;
                printf("Enter size n for the n x n matrix: ");
                scanf("%d", &n);
                get_matrix_input(a, n, n, "Matrix");
                printf("\nDeterminant = %.4f\n", determinant(a, n));
                break;
            }

            case 9: {
                int n;
                printf("Enter size n for the n x n matrix: ");
                scanf("%d", &n);
                get_matrix_input(a, n, n, "Matrix");
                if (inverse_matrix(a, result, n)) {
                    printf("\nInverse Matrix:\n");
                    print_matrix(result, n, n);
                    save_last_result(result, n, n);
                } else {
                    printf("\nMatrix is singular; inverse does not exist.\n");
                }
                break;
            }

            case 10:
                printf("Enter rows and columns of the matrix: ");
                scanf("%d %d", &rowsA, &colsA);
                get_matrix_input(a, rowsA, colsA, "Matrix");
                {
                    int rank = gaussian_eliminate(a, rowsA, colsA);
                    printf("\nRank = %d\n", rank);
                }
                break;

            case 11: {
                int n;
                printf("Enter size n for the n x n matrix: ");
                scanf("%d", &n);
                get_matrix_input(a, n, n, "Matrix");
                printf("\nTrace = %.4f\n", trace_matrix(a, n));
                break;
            }

            case 12: {
                int n;
                printf("Enter size n for the n x n matrix: ");
                scanf("%d", &n);
                get_matrix_input(a, n, n, "Matrix");
                adjoint_matrix(a, result, n);
                printf("\nAdjoint Matrix:\n");
                print_matrix(result, n, n);
                save_last_result(result, n, n);
                break;
            }

            case 13: {
                int n;
                printf("Enter size n for the n x n matrix: ");
                scanf("%d", &n);
                get_matrix_input(a, n, n, "Matrix");
                cofactor_matrix(a, result, n);
                printf("\nCofactor Matrix:\n");
                print_matrix(result, n, n);
                save_last_result(result, n, n);
                break;
            }

            case 14: {
                printf("Enter rows and columns of the matrix: ");
                scanf("%d %d", &rowsA, &colsA);
                get_matrix_input(a, rowsA, colsA, "Matrix");
                int rank = gaussian_eliminate(a, rowsA, colsA);
                printf("\nRow-Echelon Form:\n");
                print_matrix(a, rowsA, colsA);
                printf("Rank = %d\n", rank);
                save_last_result(a, rowsA, colsA);
                break;
            }

            case 15: {
                int n;
                double L[MAX_SIZE][MAX_SIZE], U[MAX_SIZE][MAX_SIZE];
                printf("Enter size n for the n x n matrix: ");
                scanf("%d", &n);
                get_matrix_input(a, n, n, "Matrix");
                if (lu_decompose(a, L, U, n)) {
                    printf("\nLower Triangular (L):\n");
                    print_matrix(L, n, n);
                    printf("\nUpper Triangular (U):\n");
                    print_matrix(U, n, n);
                    save_last_result(U, n, n); // U saved since it's the more commonly reused piece
                } else {
                    printf("\nLU decomposition without pivoting failed (zero pivot encountered).\n");
                }
                break;
            }

            case 16: {
                int n, p;
                printf("Enter size n for the n x n matrix: ");
                scanf("%d", &n);
                get_matrix_input(a, n, n, "Matrix");
                printf("Enter non-negative integer power p: ");
                scanf("%d", &p);
                if (p < 0) {
                    printf("Negative powers are not supported.\n");
                    break;
                }
                matrix_power(a, result, n, p);
                printf("\nResult (Matrix^%d):\n", p);
                print_matrix(result, n, n);
                save_last_result(result, n, n);
                break;
            }

            case 17: {
                int n;
                double bvec[MAX_SIZE], x[MAX_SIZE];
                printf("Enter size n (system of n equations, n unknowns): ");
                scanf("%d", &n);
                get_matrix_input(a, n, n, "Matrix A");
                printf("Vector b (%d values):\n", n);
                for (int i = 0; i < n; i++) scanf("%lf", &bvec[i]);
                if (solve_linear_system(a, bvec, x, n)) {
                    printf("\nSolution x:\n");
                    for (int i = 0; i < n; i++) printf("x%d = %.4f\n", i + 1, x[i]);
                    for (int i = 0; i < n; i++) result[i][0] = x[i];
                    save_last_result(result, n, 1); // saved as an n x 1 column vector
                } else {
                    printf("\nThe system has no unique solution (singular matrix).\n");
                }
                break;
            }

            case 18: {
                int n;
                printf("Enter size n (2 or 3 only): ");
                scanf("%d", &n);
                if (n != 2 && n != 3) {
                    printf("Eigenvalue computation only supported for 2x2 and 3x3 matrices.\n");
                    break;
                }
                get_matrix_input(a, n, n, "Matrix");
                printf("\n");
                if (n == 2) eigen_2x2(a);
                else eigen_3x3(a);
                break;
            }

            default:
                printf("Invalid choice.\n");
        }

        printf("\nRun another operation? (1 = yes, 0 = no): ");
        scanf("%d", &again);

    } while (again == 1);

    printf("Goodbye!\n");
    return 0;
}
