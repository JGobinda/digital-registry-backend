const RegistryEntry = require("../models/RegistryEntry");
const { sendSuccess, sendError, buildPagination } = require("../utils/response");

// ─────────────────────────────────────────────────
// GET /entries  — list with pagination, filter, search
// ─────────────────────────────────────────────────
const getAllEntries = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      startDate,
      endDate,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = {};
    if (req.user.role !== "admin") filter.createdBy = req.user._id;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (search) filter.$text = { $search: search };

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [entries, total] = await Promise.all([
      RegistryEntry.find(filter)
        .populate("createdBy", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      RegistryEntry.countDocuments(filter),
    ]);

    sendSuccess(res, {
      data: entries,
      pagination: buildPagination(total, pageNum, limitNum),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────
// GET /entries/:id
// ─────────────────────────────────────────────────
const getEntryById = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role !== "admin") filter.createdBy = req.user._id;

    const entry = await RegistryEntry.findOne(filter).populate("createdBy", "name email");
    if (!entry) {
      return sendError(res, { statusCode: 404, message: "Registry entry not found." });
    }

    sendSuccess(res, { data: entry });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────
// POST /entries
// ─────────────────────────────────────────────────
const createEntry = async (req, res, next) => {
  try {
    const entry = await RegistryEntry.create({
      ...req.body,
      createdBy: req.user._id,
    });

    await entry.populate("createdBy", "name email");

    sendSuccess(res, {
      statusCode: 201,
      message: "Registry entry created successfully",
      data: entry,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────
// PATCH /entries/:id
// ─────────────────────────────────────────────────
const updateEntry = async (req, res, next) => {
  try {
    const IMMUTABLE = ["createdBy", "registrationNumber", "category"];
    IMMUTABLE.forEach((f) => delete req.body[f]);

    const filter = { _id: req.params.id };
    if (req.user.role !== "admin") filter.createdBy = req.user._id;

    const entry = await RegistryEntry.findOneAndUpdate(filter, req.body, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "name email");

    if (!entry) {
      return sendError(res, {
        statusCode: 404,
        message: "Registry entry not found or you don't have permission to update it.",
      });
    }

    sendSuccess(res, { message: "Registry entry updated successfully", data: entry });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────
// DELETE /entries/:id  (soft delete)
// ─────────────────────────────────────────────────
const deleteEntry = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role !== "admin") filter.createdBy = req.user._id;

    const entry = await RegistryEntry.findOneAndUpdate(
      filter,
      { isDeleted: true },
      { new: true }
    );

    if (!entry) {
      return sendError(res, {
        statusCode: 404,
        message: "Registry entry not found or you don't have permission to delete it.",
      });
    }

    sendSuccess(res, { message: "Registry entry deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────
// GET /entries/stats  (admin only)
// ─────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const [byCategory, byStatus, recentCount] = await Promise.all([
      RegistryEntry.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      RegistryEntry.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      RegistryEntry.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    const total = await RegistryEntry.countDocuments();

    sendSuccess(res, {
      data: { total, recentCount, byCategory, byStatus },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllEntries, getEntryById, createEntry, updateEntry, deleteEntry, getStats };
