const mongoose = require("mongoose");

// ── Reusable sub-schemas ──────────────────────────

const nameSchema = new mongoose.Schema(
  {
    firstNameNepali: { type: String, trim: true },
    middleNameNepali: { type: String, trim: true },
    lastNameNepali: { type: String, trim: true },
    firstName: { type: String, trim: true },
    middleName: { type: String, trim: true },
    lastName: { type: String, trim: true },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    state: { type: String, trim: true },
    district: { type: String, trim: true },
    localLevel: { type: String, trim: true },
    ward: { type: String, trim: true },
    villageTole: { type: String, trim: true },
    foreignAddress: { type: String, trim: true },
  },
  { _id: false }
);

const familyMemberSchema = new mongoose.Schema(
  {
    ...nameSchema.obj,
    citizenshipNo: { type: String, trim: true },
    nin: { type: String, trim: true },
    nationality: { type: String, trim: true },
    nationalityText: { type: String, trim: true },
    permanentAddress: { type: addressSchema },
  },
  { _id: false }
);

// ── Main Schema ───────────────────────────────────

const demographicSchema = new mongoose.Schema(
  {
    // ── SCREEN 1: Category ──────────────────────────
    applicantCategory: {
      type: String,
      enum: ["CAT1", "CAT2", "CAT3", null],
      default: null,
    },

    // ── SCREEN 2: Applicant Data ────────────────────
  // In the schema field:
    processId: {
      type: String,
      unique: true,
      sparse: true,   // allows null during generation before save
      immutable: true,
      required: true,
      default: () => {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const random = Math.random().toString(36).toUpperCase().slice(2, 8);
        return `REG-${date}-${random}`;
      },
    },
    nationalIdNumber: { type: String, trim: true },

    // Main Applicant Identity
    identity: {
      ...nameSchema.obj,
      dateOfBirthNepali: { type: String, trim: true }, // BS date stored as string
      dateOfBirth: { type: Date },
      citizenshipNo: { type: String, trim: true },
      birthDistrict: { type: String, trim: true },
      ccType: { type: String, trim: true },         // citizenship certificate type
      issuedDistrict: { type: String, trim: true },
      issuedDate: { type: Date },
    },

    // Additional Personal Information
    additionalInfo: {
      gender: { type: String, trim: true },
      maritalStatus: { type: String, trim: true },
      fatherStatus: { type: String, trim: true },
      education: { type: String, trim: true },
      business: { type: String, trim: true },
      cast: { type: String, trim: true },
      religion: { type: String, trim: true },
    },

    // ── SCREEN 3: Contact Details ───────────────────
    permanentAddress: {
      phone: { type: String, trim: true },
      mobile: { type: String, trim: true },
      state: { type: String, trim: true },
      district: { type: String, trim: true },
      localLevel: { type: String, trim: true },
      ward: { type: String, trim: true },
      villageTole: { type: String, trim: true },
    },

    copyPermanentToTemporary: { type: Boolean, default: false },

    temporaryAddress: {
      state: { type: String, trim: true },
      district: { type: String, trim: true },
      localLevel: { type: String, trim: true },
      ward: { type: String, trim: true },
      villageTole: { type: String, trim: true },
    },

    // ── SCREEN 4 & 5: Family Details ────────────────
    family: {
      father: { type: familyMemberSchema },
      mother: { type: familyMemberSchema },
      grandfather: { type: familyMemberSchema },
      grandmother: { type: familyMemberSchema },
      spouse: { type: familyMemberSchema },
    },

    // ── SCREEN 6: Land & Housing ────────────────────
    landOwnership: {
      ownsLandInNepal: { type: String, trim: true }, // yes/no/partial etc.
    },

    housing: {
      isHouseBuilt: { type: String, trim: true },
      preferredHousingForm: {
        type: String,
        enum: [
          "individual",       // Individual housing unit (independent house)
          "apartment",        // Multi-residential building (apartment type)
          "community",        // Integrated settlement-based (community-based)
          null,
        ],
        default: null,
      },
    },

    // ── SCREEN 7: Economic & Health ─────────────────
    economicStatus: {
      mainIncomeSource: { type: String, trim: true },
      totalMonthlyIncome: { type: String, trim: true }, // stored as range string
      hasSavingsOrAssets: { type: String, trim: true },
      economicEmpowermentOption: {
        type: [String],
        enum: [
          "self_employment",
          "cost_sharing",
          "gov_support",
          "employment_opportunity",
          "skill_development",
        ],
        default: [],
      },
    },

    familyHealth: {
      chronicIllness: { type: String, trim: true },
    },

    familySpecificDetails: {
      pregnant: { type: Number, default: null },
      nursing: { type: Number, default: null },
      childrenUnder5: {
        boy: { type: Number, default: null },
        girl: { type: Number, default: null },
      },
      children5to16: {
        male: { type: Number, default: null },
        female: { type: Number, default: null },
      },
      seniorCitizens65Plus: {
        male: { type: Number, default: null },
        female: { type: Number, default: null },
      },
      disability: {
        male: { type: Number, default: null },
        female: { type: Number, default: null },
      },
    },

    // ── Meta ─────────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        delete ret.isDeleted;
        return ret;
      },
    },
  }
);

// Indexes
demographicSchema.index({ nationalIdNumber: 1 }, { sparse: true });
demographicSchema.index({ processId: 1 }, { sparse: true });
demographicSchema.index({ applicantCategory: 1 });
demographicSchema.index({ createdBy: 1 });
demographicSchema.index({ "identity.firstName": "text", "identity.lastName": "text" });

// Soft-delete filter
demographicSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  if (!this.processId) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).toUpperCase().slice(2, 8);
    this.processId = `REG-${date}-${random}`;
  }
  console.log('here')
  next();
});

module.exports = mongoose.model("Demographic", demographicSchema);
