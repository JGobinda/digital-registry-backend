const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Digital Registry API",
      version: "1.0.0",
      description:
        "A RESTful API for Digital Registry with JWT authentication and CRUD operations for registry entries.",
      contact: {
        name: "Digital Registry Team",
        email: "support@digitalregistry.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:5000/api/v1",
        description: "Development Server",
      },
      {
        url: "https://api.digitalregistry.com/api/v1",
        description: "Production Server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token in the format: Bearer <token>",
        },
      },
      schemas: {
        // ── Auth ──────────────────────────────────────────────
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "Jane Doe", minLength: 2, maxLength: 50 },
            email: { type: "string", format: "email", example: "jane@example.com" },
            password: {
              type: "string",
              format: "password",
              minLength: 8,
              example: "SecurePass@123",
            },
            role: {
              type: "string",
              enum: ["user", "admin"],
              default: "user",
              example: "user",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "jane@example.com" },
            password: { type: "string", format: "password", example: "SecurePass@123" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Login successful" },
            data: {
              type: "object",
              properties: {
                user: { $ref: "#/components/schemas/UserProfile" },
                accessToken: {
                  type: "string",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
                refreshToken: {
                  type: "string",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
                expiresIn: { type: "string", example: "7d" },
              },
            },
          },
        },
        UserProfile: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
            name: { type: "string", example: "Jane Doe" },
            email: { type: "string", example: "jane@example.com" },
            role: { type: "string", example: "user" },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },

        // ── Registry Entry ────────────────────────────────────
        CreateEntryRequest: {
          type: "object",
          required: ["title", "category"],
          properties: {
            title: { type: "string", example: "Business License #2024-001", maxLength: 150 },
            category: {
              type: "string",
              enum: ["business", "property", "vehicle", "person", "asset", "other"],
              example: "business",
            },
            description: {
              type: "string",
              example: "Annual business registration for ABC Corp",
              maxLength: 1000,
            },
            registrationNumber: { type: "string", example: "REG-2024-001" },
            issuedDate: { type: "string", format: "date", example: "2024-01-15" },
            expiryDate: { type: "string", format: "date", example: "2025-01-15" },
            status: {
              type: "string",
              enum: ["active", "inactive", "pending", "expired"],
              default: "pending",
              example: "active",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              example: ["verified", "priority"],
            },
            metadata: {
              type: "object",
              additionalProperties: true,
              example: { owner: "ABC Corp", district: "North" },
            },
          },
        },
        UpdateEntryRequest: {
          type: "object",
          properties: {
            title: { type: "string", example: "Updated Title" },
            description: { type: "string", example: "Updated description" },
            status: {
              type: "string",
              enum: ["active", "inactive", "pending", "expired"],
            },
            expiryDate: { type: "string", format: "date" },
            tags: { type: "array", items: { type: "string" } },
            metadata: { type: "object", additionalProperties: true },
          },
        },
        RegistryEntry: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
            title: { type: "string", example: "Business License #2024-001" },
            category: { type: "string", example: "business" },
            description: { type: "string" },
            registrationNumber: { type: "string", example: "REG-2024-001" },
            issuedDate: { type: "string", format: "date-time" },
            expiryDate: { type: "string", format: "date-time" },
            status: { type: "string", example: "active" },
            tags: { type: "array", items: { type: "string" } },
            metadata: { type: "object" },
            createdBy: { $ref: "#/components/schemas/UserProfile" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // ── Common ────────────────────────────────────────────
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data: { type: "object" },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "array", items: {} },
            pagination: {
              type: "object",
              properties: {
                total: { type: "integer", example: 100 },
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 10 },
                totalPages: { type: "integer", example: 10 },
                hasNextPage: { type: "boolean" },
                hasPrevPage: { type: "boolean" },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "An error occurred" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: "Health", description: "API health check endpoints" },
      { name: "Auth", description: "Authentication — register, login, token refresh, profile" },
      { name: "Registry Entries", description: "CRUD operations for digital registry entries" },
    ],
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);
