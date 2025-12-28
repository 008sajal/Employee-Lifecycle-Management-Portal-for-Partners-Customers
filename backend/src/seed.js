const bcrypt = require("bcryptjs");

const { connectDb } = require("./db/connect");
const { User } = require("./models/User");
const { Partner } = require("./models/Partner");
const { Customer } = require("./models/Customer");
const { Device } = require("./models/Device");
const { Employee } = require("./models/Employee");
const { SystemSettings } = require("./models/SystemSettings");

async function seed() {
  await connectDb();

  const superadminEmail = "admin@belzir.dev";
  const partnerEmail = "partner@belzir.dev";
  const customerEmail = "customer@belzir.dev";
  const password = "Password123!";

  await Promise.all([
    User.deleteMany({ email: { $in: [superadminEmail, partnerEmail, customerEmail] } }),
    Partner.deleteMany({ name: "Demo Partner" }),
    Customer.deleteMany({ name: "Demo Customer" }),
    Customer.deleteMany({ name: "Acme Inc." })
  ]);

  const partner = await Partner.create({ name: "Demo Partner", commissionRate: 0.05 });
  const customer = await Customer.create({ name: "Acme Inc.", partnerId: partner._id, status: "active" });

  const passwordHash = await bcrypt.hash(password, 10);

  await User.create({ email: superadminEmail, passwordHash, role: "superadmin", status: "active" });
  await User.create({ email: partnerEmail, passwordHash, role: "partner", partnerId: partner._id, status: "active" });
  await User.create({ email: customerEmail, passwordHash, role: "customer", customerId: customer._id, status: "active" });

  await Device.create([
    {
      name: "Cust-Laptop-001",
      os: "windows",
      ownerType: "customer",
      customerId: customer._id,
      status: "available",
      cyberProtectionEnabled: true,
      encryptionEnabled: true
    },
    {
      name: "Belzir-Mac-002",
      os: "macos",
      ownerType: "belzir",
      customerId: null,
      status: "available",
      cyberProtectionEnabled: true,
      encryptionEnabled: true
    }
  ]);

  await SystemSettings.deleteMany({ singleton: "singleton" });
  await SystemSettings.create({
    singleton: "singleton",
    companyName: "Acme Inc.",
    supportEmail: "support@acme-inc.com",
    defaultPartnerCommissionRate: 0.05,
    maintenanceMode: false
  });

  await Employee.deleteMany({ customerId: customer._id });
  await Employee.create([
    {
      customerId: customer._id,
      firstName: "Emmanuel",
      lastName: "Imberg",
      email: "emmanuel.imberg@acme-inc.com",
      location: "Berlin",
      jobTitle: "Product Designer",
      department: "Design",
      status: "active",
      onboardingStep: null
    },
    {
      customerId: customer._id,
      firstName: "Francesco",
      lastName: "Pitzl",
      email: "francesco.pitzl@acme-inc.com",
      location: "Berlin",
      jobTitle: "Senior Product Designer",
      department: "Design",
      status: "onboarding",
      onboardingStep: 1
    },
    {
      customerId: customer._id,
      firstName: "Hans",
      lastName: "Huffer",
      email: "hans.huffer@acme-inc.com",
      location: "Munich",
      jobTitle: "Operations Manager",
      department: "Operations",
      status: "offboarding",
      onboardingStep: null,
      offboardingStep: 1
    },
    {
      customerId: customer._id,
      firstName: "Irma",
      lastName: "Harig",
      email: "irma.harig@acme-inc.com",
      location: "Hamburg",
      jobTitle: "People Operations",
      department: "HR",
      status: "active",
      onboardingStep: null
    },
    {
      customerId: customer._id,
      firstName: "Laura",
      lastName: "Erdmann",
      email: "laura.erdmann@acme-inc.com",
      location: "Berlin",
      jobTitle: "Account Executive",
      department: "Sales",
      status: "active",
      onboardingStep: null
    },
    {
      customerId: customer._id,
      firstName: "Rebecca",
      lastName: "Lang",
      email: "rebecca.lang@acme-inc.com",
      location: "Berlin",
      jobTitle: "Product Marketing",
      department: "Marketing",
      status: "leave",
      onboardingStep: null
    },
    {
      customerId: customer._id,
      firstName: "Theo",
      lastName: "Hofmann",
      email: "theo.hofmann@acme-inc.com",
      location: "Berlin",
      jobTitle: "Software Engineer",
      department: "Engineering",
      status: "onboarding",
      onboardingStep: 1
    },
    {
      customerId: customer._id,
      firstName: "Victor",
      lastName: "Ambrossio",
      email: "victor.ambrossio@acme-inc.com",
      location: "Berlin",
      jobTitle: "Designer",
      department: "Design",
      status: "onboarding",
      onboardingStep: 1
    }
  ]);

  // eslint-disable-next-line no-console
  console.log("Seed complete:");
  // eslint-disable-next-line no-console
  console.log({
    superadminEmail,
    partnerEmail,
    customerEmail,
    password
  });

  process.exit(0);
}

seed().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
