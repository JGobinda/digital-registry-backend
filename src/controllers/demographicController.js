const Demographic = require("../models/Demographic");
const { sendSuccess, sendError, buildPagination } = require("../utils/response");

// ─────────────────────────────────────────────────
// GET /demographics  — list with pagination & filters
// ─────────────────────────────────────────────────
const getAllDemographics = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      gender,
      district,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (req.user.role !== "admin") filter.createdBy = req.user._id;
    if (category) filter.applicantCategory = category;
    if (gender) filter["additionalInfo.gender"] = gender;
    if (district) filter["permanentAddress.district"] = district;
    if (search) filter.$text = { $search: search };

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [records, total] = await Promise.all([
      Demographic.find(filter)
        .populate("createdBy", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Demographic.countDocuments(filter),
    ]);

    sendSuccess(res, {
      data: records,
      pagination: buildPagination(total, pageNum, limitNum),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────
// GET /demographics/:id
// ─────────────────────────────────────────────────
const getDemographicById = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role !== "admin") filter.createdBy = req.user._id;

    const record = await Demographic.findOne(filter).populate("createdBy", "name email");
    if (!record) {
      return sendError(res, { statusCode: 404, message: "Demographic record not found." });
    }

    sendSuccess(res, { data: record });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────
// POST /demographics
// ─────────────────────────────────────────────────
const createDemographic = async (req, res, next) => {
  try {
    const record = await Demographic.create({
      ...req.body,
      createdBy: req.user._id,
    });

    await record.populate("createdBy", "name email");

    sendSuccess(res, {
      statusCode: 201,
      message: "Demographic record created successfully",
      data: record,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────
// PATCH /demographics/:id  — partial update
// ─────────────────────────────────────────────────
const updateDemographic = async (req, res, next) => {
  try {
    // Prevent accidental override of meta fields
    const IMMUTABLE = ["createdBy", "processId", "_id"];
    IMMUTABLE.forEach((f) => delete req.body[f]);

    const filter = { processId: req.params.processId };
    if (req.user.role !== "admin") filter.createdBy = req.user._id;

    const record = await Demographic.findOneAndUpdate(
      filter,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");

    if (!record) {
      return sendError(res, {
        statusCode: 404,
        message: "Demographic record not found or insufficient permissions.",
      });
    }

    sendSuccess(res, { message: "Demographic record updated successfully", data: record });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────
// DELETE /demographics/:id  — soft delete
// ─────────────────────────────────────────────────
const deleteDemographic = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role !== "admin") filter.createdBy = req.user._id;

    const record = await Demographic.findOneAndUpdate(
      filter,
      { isDeleted: true },
      { new: true }
    );

    if (!record) {
      return sendError(res, {
        statusCode: 404,
        message: "Demographic record not found or insufficient permissions.",
      });
    }

    sendSuccess(res, { message: "Demographic record deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────
// GET /demographics/stats  (admin only)
// ─────────────────────────────────────────────────
const getDemographicStats = async (req, res, next) => {
  try {
    const [byCategory, byGender, byDistrict, byMaritalStatus, total] = await Promise.all([
      Demographic.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: "$applicantCategory", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Demographic.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: "$additionalInfo.gender", count: { $sum: 1 } } },
      ]),
      Demographic.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: "$permanentAddress.district", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Demographic.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: "$additionalInfo.maritalStatus", count: { $sum: 1 } } },
      ]),
      Demographic.countDocuments({ isDeleted: { $ne: true } }),
    ]);

    sendSuccess(res, {
      data: { total, byCategory, byGender, byDistrict, byMaritalStatus },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllDemographics,
  getDemographicById,
  createDemographic,
  updateDemographic,
  deleteDemographic,
  getDemographicStats,
};
