const express = require("express");
const { query } = require("express-validator");
const router = express.Router();

const {
  getAllDemographics,
  getDemographicById,
  createDemographic,
  updateDemographic,
  deleteDemographic,
  getDemographicStats,
} = require("../controllers/demographicController");
const { protect, restrict } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

router.use(protect);

const listRules = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("sortOrder").optional().isIn(["asc", "desc"]),
  query("category").optional().isIn(["CAT1", "CAT2", "CAT3"]),
];

// ─────────────────────────────────────────────────
// Swagger schema definitions (inline via JSDoc)
// ─────────────────────────────────────────────────

/**
 * @swagger
 * components:
 *   schemas:
 *     AddressInput:
 *       type: object
 *       properties:
 *         state:          { type: string, example: "Bagmati" }
 *         district:       { type: string, example: "Kathmandu" }
 *         localLevel:     { type: string, example: "Kathmandu Metropolitan" }
 *         ward:           { type: string, example: "10" }
 *         villageTole:    { type: string, example: "Thamel" }
 *         foreignAddress: { type: string, example: "123 London St" }
 *
 *     FamilyMemberInput:
 *       type: object
 *       properties:
 *         firstNameNepali:  { type: string }
 *         middleNameNepali: { type: string }
 *         lastNameNepali:   { type: string }
 *         firstName:        { type: string }
 *         middleName:       { type: string }
 *         lastName:         { type: string }
 *         citizenshipNo:    { type: string }
 *         nin:              { type: string }
 *         nationality:      { type: string }
 *         nationalityText:  { type: string }
 *         permanentAddress:
 *           $ref: '#/components/schemas/AddressInput'
 *
 *     DemographicInput:
 *       type: object
 *       description: >
 *         All fields are optional. Send only the sections you have data for.
 *         Mirrors the 7-screen applicant registration form.
 *       properties:
 *         applicantCategory:
 *           type: string
 *           enum: [CAT1, CAT2, CAT3]
 *           description: "CAT1=All docs, CAT2=No NIN but has citizenship/voting card, CAT3=No documents"
 *           example: CAT1
 *
 *         processId:
 *           type: string
 *           example: "9702686905585"
 *         nationalIdNumber:
 *           type: string
 *           example: "12345678"
 *
 *         identity:
 *           type: object
 *           properties:
 *             firstNameNepali:  { type: string, example: "नेपाल" }
 *             middleNameNepali: { type: string, example: "प्रसाद" }
 *             lastNameNepali:   { type: string, example: "शर्मा" }
 *             firstName:        { type: string, example: "Nepal" }
 *             middleName:       { type: string, example: "Prasad" }
 *             lastName:         { type: string, example: "Sharma" }
 *             dateOfBirthNepali:
 *               type: string
 *               example: "2045-05-15"
 *             dateOfBirth:      { type: string, format: date, example: "1988-08-31" }
 *             citizenshipNo:    { type: string, example: "12-34-56-789" }
 *             birthDistrict:    { type: string, example: "Kathmandu" }
 *             ccType:           { type: string, example: "Birth" }
 *             issuedDistrict:   { type: string, example: "Lalitpur" }
 *             issuedDate:       { type: string, format: date, example: "2010-03-20" }
 *
 *         additionalInfo:
 *           type: object
 *           properties:
 *             gender:        { type: string, example: "Male" }
 *             maritalStatus: { type: string, example: "Married" }
 *             fatherStatus:  { type: string, example: "Known" }
 *             education:     { type: string, example: "Bachelor" }
 *             business:      { type: string, example: "Agriculture" }
 *             cast:          { type: string, example: "Brahmin" }
 *             religion:      { type: string, example: "Hindu" }
 *
 *         permanentAddress:
 *           type: object
 *           properties:
 *             phone:       { type: string, example: "01-4xxxxxx" }
 *             mobile:      { type: string, example: "98xxxxxxxx" }
 *             state:       { type: string }
 *             district:    { type: string }
 *             localLevel:  { type: string }
 *             ward:        { type: string }
 *             villageTole: { type: string }
 *
 *         copyPermanentToTemporary:
 *           type: boolean
 *           default: false
 *
 *         temporaryAddress:
 *           $ref: '#/components/schemas/AddressInput'
 *
 *         family:
 *           type: object
 *           properties:
 *             father:      { $ref: '#/components/schemas/FamilyMemberInput' }
 *             mother:      { $ref: '#/components/schemas/FamilyMemberInput' }
 *             grandfather: { $ref: '#/components/schemas/FamilyMemberInput' }
 *             grandmother: { $ref: '#/components/schemas/FamilyMemberInput' }
 *             spouse:      { $ref: '#/components/schemas/FamilyMemberInput' }
 *
 *         landOwnership:
 *           type: object
 *           properties:
 *             ownsLandInNepal: { type: string, example: "Yes" }
 *
 *         housing:
 *           type: object
 *           properties:
 *             isHouseBuilt:
 *               type: string
 *               example: "Yes"
 *             preferredHousingForm:
 *               type: string
 *               enum: [individual, apartment, community]
 *               example: individual
 *
 *         economicStatus:
 *           type: object
 *           properties:
 *             mainIncomeSource:    { type: string, example: "Agriculture" }
 *             totalMonthlyIncome:  { type: string, example: "10000-20000" }
 *             hasSavingsOrAssets:  { type: string, example: "Yes" }
 *             economicEmpowermentOption:
 *               type: array
 *               items:
 *                 type: string
 *                 enum: [self_employment, cost_sharing, gov_support, employment_opportunity, skill_development]
 *               example: [gov_support, skill_development]
 *
 *         familyHealth:
 *           type: object
 *           properties:
 *             chronicIllness: { type: string, example: "None" }
 *
 *         familySpecificDetails:
 *           type: object
 *           properties:
 *             pregnant: { type: integer, example: 1 }
 *             nursing:  { type: integer, example: 0 }
 *             childrenUnder5:
 *               type: object
 *               properties:
 *                 boy:  { type: integer, example: 2 }
 *                 girl: { type: integer, example: 1 }
 *             children5to16:
 *               type: object
 *               properties:
 *                 male:   { type: integer, example: 1 }
 *                 female: { type: integer, example: 2 }
 *             seniorCitizens65Plus:
 *               type: object
 *               properties:
 *                 male:   { type: integer, example: 1 }
 *                 female: { type: integer, example: 0 }
 *             disability:
 *               type: object
 *               properties:
 *                 male:   { type: integer, example: 0 }
 *                 female: { type: integer, example: 1 }
 *
 *     DemographicRecord:
 *       allOf:
 *         - $ref: '#/components/schemas/DemographicInput'
 *         - type: object
 *           properties:
 *             _id:       { type: string, example: "64f1a2b3c4d5e6f7a8b9c0d1" }
 *             createdBy: { $ref: '#/components/schemas/UserProfile' }
 *             createdAt: { type: string, format: date-time }
 *             updatedAt: { type: string, format: date-time }
 */

// ─────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /demographics/stats:
 *   get:
 *     tags: [Demographics]
 *     summary: Aggregated demographic statistics (admin only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Stats broken down by category, gender, district, marital status
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
 *                         total:           { type: integer }
 *                         byCategory:      { type: array, items: { type: object } }
 *                         byGender:        { type: array, items: { type: object } }
 *                         byDistrict:      { type: array, items: { type: object } }
 *                         byMaritalStatus: { type: array, items: { type: object } }
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/stats", restrict("admin"), getDemographicStats);

/**
 * @swagger
 * /demographics:
 *   get:
 *     tags: [Demographics]
 *     summary: List demographic records with pagination and filters
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
 *         schema: { type: string, enum: [CAT1, CAT2, CAT3] }
 *       - in: query
 *         name: gender
 *         schema: { type: string }
 *       - in: query
 *         name: district
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Full-text search on name fields
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated list of demographic records
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
 *                         $ref: '#/components/schemas/DemographicRecord'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", listRules, validate, getAllDemographics);

/**
 * @swagger
 * /demographics/{processId}:
 *   get:
 *     tags: [Demographics]
 *     summary: Get a single demographic record by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: processId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Demographic record detail
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DemographicRecord'
 *       404:
 *         description: Record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:processId", getDemographicById);

/**
 * @swagger
 * /demographics:
 *   post:
 *     tags: [Demographics]
 *     summary: Create a new demographic record
 *     description: >
 *       Creates a demographic entry using a flexible, multi-step payload structure.
 *       All fields are optional and can be submitted incrementally.
 *       Supports partial submission across different form sections.
 *     security:
 *       - BearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DemographicInput'
 *
 *           example:
 *             applicantCategory: CAT1
 *             nationalIdNumber: "12345678"
 *
 *             identity:
 *               firstNameNepali: "नेपाल"
 *               middleNameNepali: "प्रसाद"
 *               lastNameNepali: "शर्मा"
 *               firstName: "Nepal"
 *               middleName: "Prasad"
 *               lastName: "Sharma"
 *               dateOfBirthNepali: "2045-05-15"
 *               dateOfBirth: "1988-08-31"
 *               citizenshipNo: "12-34-56-789"
 *               birthDistrict: "Kathmandu"
 *               ccType: "Birth"
 *               issuedDistrict: "Lalitpur"
 *               issuedDate: "2010-03-20"
 *
 *             additionalInfo:
 *               gender: "Male"
 *               maritalStatus: "Married"
 *               fatherStatus: "Known"
 *               education: "Bachelor"
 *               business: "Agriculture"
 *               cast: "Brahmin"
 *               religion: "Hindu"
 *
 *             permanentAddress:
 *               phone: "01-4000000"
 *               mobile: "9800000000"
 *               state: "Bagmati"
 *               district: "Kathmandu"
 *               localLevel: "Kathmandu Metropolitan"
 *               ward: "10"
 *               villageTole: "Thamel"
 *
 *             copyPermanentToTemporary: true
 *
 *             temporaryAddress:
 *               state: "Bagmati"
 *               district: "Lalitpur"
 *               localLevel: "Lalitpur Metropolitan"
 *               ward: "5"
 *               villageTole: "Jawalakhel"
 *
 *             family:
 *               father:
 *                 firstName: "Ram"
 *                 lastName: "Sharma"
 *                 citizenshipNo: "11-22-33-444"
 *                 nationality: "Nepali"
 *               mother:
 *                 firstName: "Sita"
 *                 lastName: "Sharma"
 *               spouse:
 *                 firstName: "Gita"
 *                 lastName: "Sharma"
 *
 *             landOwnership:
 *               ownsLandInNepal: "Yes"
 *
 *             housing:
 *               isHouseBuilt: "Yes"
 *               preferredHousingForm: "individual"
 *
 *             economicStatus:
 *               mainIncomeSource: "Agriculture"
 *               totalMonthlyIncome: "10000-20000"
 *               hasSavingsOrAssets: "Yes"
 *               economicEmpowermentOption:
 *                 - gov_support
 *                 - skill_development
 *
 *             familyHealth:
 *               chronicIllness: "None"
 *
 *             familySpecificDetails:
 *               pregnant: 1
 *               nursing: 0
 *               childrenUnder5:
 *                 boy: 1
 *                 girl: 1
 *               children5to16:
 *                 male: 1
 *                 female: 2
 *               seniorCitizens65Plus:
 *                 male: 1
 *                 female: 0
 *               disability:
 *                 male: 0
 *                 female: 1
 *
 *     responses:
 *       201:
 *         description: Demographic record successfully created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DemographicRecord'
 *
 *       400:
 *         description: Invalid request payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *       401:
 *         description: Unauthorized access
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", createDemographic);

/**
 * @swagger
 * /demographics/{processId}:
 *   patch:
 *     tags: [Demographics]
 *     summary: Partially update a demographic record
 *     description: >
 *       Send only the top-level sections you want to update (e.g. just `economicStatus`).
 *       Fields not included are left untouched. Nested objects are merged via `$set`.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: processId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DemographicInput'
 *           example:
 *             housing:
 *               isHouseBuilt: "Yes"
 *               preferredHousingForm: individual
 *             familyHealth:
 *               chronicIllness: Diabetes
 *     responses:
 *       200:
 *         description: Record updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DemographicRecord'
 *       404:
 *         description: Record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:processId", updateDemographic);

/**
 * @swagger
 * /demographics/{processId}:
 *   delete:
 *     tags: [Demographics]
 *     summary: Soft-delete a demographic record
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: processId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Record deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:processId", deleteDemographic);

module.exports = router;
