const express = require("express");
const { body, query } = require("express-validator");
const router = express.Router();

const {
  getAllEntries,
  getEntryById,
  createEntry,
  updateEntry,
  deleteEntry,
  getStats,
} = require("../controllers/registryController");
const { protect, restrict } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

// All routes require authentication
router.use(protect);

// ── Validation rules ──────────────────────────────
const createRules = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 150 }),
  body("category")
    .isIn(["business", "property", "vehicle", "person", "asset", "other"])
    .withMessage("Invalid category"),
  body("description").optional().isLength({ max: 1000 }),
  body("status")
    .optional()
    .isIn(["active", "inactive", "pending", "expired"])
    .withMessage("Invalid status"),
  body("issuedDate").optional().isISO8601().withMessage("Invalid issued date"),
  body("expiryDate").optional().isISO8601().withMessage("Invalid expiry date"),
  body("tags").optional().isArray(),
];

const updateRules = [
  body("title").optional().trim().isLength({ max: 150 }),
  body("description").optional().isLength({ max: 1000 }),
  body("status")
    .optional()
    .isIn(["active", "inactive", "pending", "expired"])
    .withMessage("Invalid status"),
  body("expiryDate").optional().isISO8601().withMessage("Invalid expiry date"),
  body("tags").optional().isArray(),
];

const listRules = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("sortOrder").optional().isIn(["asc", "desc"]),
  query("category")
    .optional()
    .isIn(["business", "property", "vehicle", "person", "asset", "other"]),
  query("status").optional().isIn(["active", "inactive", "pending", "expired"]),
];

// ─────────────────────────────────────────────────
// Route definitions
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /entries/stats:
 *   get:
 *     tags: [Registry Entries]
 *     summary: Get registry statistics (admin only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics object
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         total: { type: integer, example: 250 }
 *                         recentCount: { type: integer, example: 12 }
 *                         byCategory:
 *                           type: array
 *                           items: { type: object }
 *                         byStatus:
 *                           type: array
 *                           items: { type: object }
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/stats", restrict("admin"), getStats);

/**
 * @swagger
 * /entries:
 *   get:
 *     tags: [Registry Entries]
 *     summary: List registry entries with pagination and filters
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [business, property, vehicle, person, asset, other]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending, expired]
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Full-text search on title and description
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Paginated list of registry entries
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/RegistryEntry'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", listRules, validate, getAllEntries);

/**
 * @swagger
 * /entries/{id}:
 *   get:
 *     tags: [Registry Entries]
 *     summary: Get a single registry entry by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId of the entry
 *     responses:
 *       200:
 *         description: Registry entry detail
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/RegistryEntry'
 *       404:
 *         description: Entry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", getEntryById);

/**
 * @swagger
 * /entries:
 *   post:
 *     tags: [Registry Entries]
 *     summary: Create a new registry entry
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEntryRequest'
 *     responses:
 *       201:
 *         description: Entry created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/RegistryEntry'
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", createRules, validate, createEntry);

/**
 * @swagger
 * /entries/{id}:
 *   patch:
 *     tags: [Registry Entries]
 *     summary: Update a registry entry
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateEntryRequest'
 *     responses:
 *       200:
 *         description: Entry updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/RegistryEntry'
 *       404:
 *         description: Entry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:id", updateRules, validate, updateEntry);

/**
 * @swagger
 * /entries/{id}:
 *   delete:
 *     tags: [Registry Entries]
 *     summary: Soft-delete a registry entry
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Entry deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Entry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", deleteEntry);

module.exports = router;
