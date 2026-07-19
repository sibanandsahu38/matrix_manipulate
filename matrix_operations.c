#include <stdio.h>

#define MAX_SIZE 10

// Read a matrix from user input
void read_matrix(int mat[MAX_SIZE][MAX_SIZE], int rows, int cols) {
    printf("Enter %d elements (row by row):\n", rows * cols);
    for (int i = 0; i < rows; i++) 
        for (int j = 0; j < cols; j++) 
            scanf("%d", &mat[i][j]);
}

// Print a matrix
void print_matrix(int mat[MAX_SIZE][MAX_SIZE], int rows, int cols) {
    for (int i = 0; i < rows; i++) 
        for (int j = 0; j < cols; j++)
            printf("%4d ", mat[i][j]);
        printf("\n");
}

// Add two matrices of the same dimensions
void add_matrices(int a[MAX_SIZE][MAX_SIZE], int b[MAX_SIZE][MAX_SIZE],
                   int result[MAX_SIZE][MAX_SIZE], int rows, int cols) {
    for (int i = 0; i < rows; i++)
        for (int j = 0; j < cols; j++)
            result[i][j] = a[i][j] + b[i][j];
}

// Multiply two matrices: a (rowsA x colsA) * b (colsA x colsB)
void multiply_matrices(int a[MAX_SIZE][MAX_SIZE], int b[MAX_SIZE][MAX_SIZE],
                        int result[MAX_SIZE][MAX_SIZE],
                        int rowsA, int colsA, int colsB) {
    for (int i = 0; i < rowsA; i++)
        for (int j = 0; j < colsB; j++) {
            result[i][j] = 0;
            for (int k = 0; k < colsA; k++) 
                result[i][j] += a[i][k] * b[k][j];
        }
}

// Transpose a matrix
void transpose_matrix(int mat[MAX_SIZE][MAX_SIZE], int result[MAX_SIZE][MAX_SIZE],
                       int rows, int cols) {
    for (int i = 0; i < rows; i++) 
        for (int j = 0; j < cols; j++) 
            result[j][i] = mat[i][j];
}

int main() {
    int a[MAX_SIZE][MAX_SIZE], b[MAX_SIZE][MAX_SIZE], result[MAX_SIZE][MAX_SIZE];
    int rowsA, colsA, rowsB, colsB;
    int choice;

    printf("=== Matrix Operations ===\n");
    printf("1. Add two matrices\n");
    printf("2. Multiply two matrices\n");
    printf("3. Transpose a matrix\n");
    printf("Enter choice: ");
    scanf("%d", &choice);

    switch (choice) {
        case 1:
            printf("Enter rows and columns for both matrices (must match): ");
            scanf("%d %d", &rowsA, &colsA);
            rowsB = rowsA;
            colsB = colsA;

            printf("Matrix A:\n");
            read_matrix(a, rowsA, colsA);
            printf("Matrix B:\n");
            read_matrix(b, rowsB, colsB);

            add_matrices(a, b, result, rowsA, colsA);

            printf("\nResult (A + B):\n");
            print_matrix(result, rowsA, colsA);
            break;

        case 2:
            printf("Enter rows and columns of Matrix A: ");
            scanf("%d %d", &rowsA, &colsA);
            printf("Enter rows and columns of Matrix B: ");
            scanf("%d %d", &rowsB, &colsB);

            if (colsA != rowsB) {
                printf("Error: columns of A must equal rows of B for multiplication.\n");
                return 1;
            }

            printf("Matrix A:\n");
            read_matrix(a, rowsA, colsA);
            printf("Matrix B:\n");
            read_matrix(b, rowsB, colsB);

            multiply_matrices(a, b, result, rowsA, colsA, colsB);

            printf("\nResult (A x B):\n");
            print_matrix(result, rowsA, colsB);
            break;

        case 3:
            printf("Enter rows and columns of the matrix: ");
            scanf("%d %d", &rowsA, &colsA);

            printf("Matrix:\n");
            read_matrix(a, rowsA, colsA);

            transpose_matrix(a, result, rowsA, colsA);

            printf("\nTransposed Matrix:\n");
            print_matrix(result, colsA, rowsA);
            break;

        default:
            printf("Invalid choice.\n");
    }

    return 0;
}
