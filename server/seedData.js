const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Company = require('./models/Company');
const Department = require('./models/Department');
const Staff = require('./models/Staff');
const Attendance = require('./models/Attendance');
const Transaction = require('./models/Transaction');

const MONGO_URI = process.env.MONGO_URI;

const departments = [
  { name: 'Web Development', description: 'Frontend & Backend devs', color: '#6366f1' },
  { name: 'AI & ML', description: 'Machine learning team', color: '#f59e0b' },
  { name: 'Cyber Security', description: 'Security & compliance', color: '#ef4444' },
  { name: 'Design', description: 'UI/UX designers', color: '#10b981' },
];

// Each staff has a name, role, salary, and login credentials
const staffByDept = {
  'Web Development': [
    { name: 'Arjun Sharma',  role: 'Senior Developer',      salary: 55000, email: 'arjun.sharma@staffflow.test',   password: 'arjun123' },
    { name: 'Priya Patel',   role: 'React Developer',        salary: 45000, email: 'priya.patel@staffflow.test',    password: 'priya123' },
    { name: 'Karan Mehta',   role: 'Node.js Developer',      salary: 48000, email: 'karan.mehta@staffflow.test',    password: 'karan123' },
    { name: 'Sneha Joshi',   role: 'Junior Developer',        salary: 32000, email: 'sneha.joshi@staffflow.test',    password: 'sneha123' },
    { name: 'Rohit Verma',   role: 'Full Stack Developer',    salary: 52000, email: 'rohit.verma@staffflow.test',    password: 'rohit123' },
    { name: 'Anita Singh',   role: 'Frontend Developer',      salary: 38000, email: 'anita.singh@staffflow.test',    password: 'anita123' },
  ],
  'AI & ML': [
    { name: 'Vikram Nair',   role: 'ML Engineer',             salary: 65000, email: 'vikram.nair@staffflow.test',    password: 'vikram123' },
    { name: 'Deepa Krishnan',role: 'Data Scientist',          salary: 60000, email: 'deepa.krishnan@staffflow.test', password: 'deepa123' },
    { name: 'Aakash Gupta',  role: 'AI Researcher',           salary: 70000, email: 'aakash.gupta@staffflow.test',   password: 'aakash123' },
    { name: 'Meera Iyer',    role: 'Data Analyst',            salary: 42000, email: 'meera.iyer@staffflow.test',     password: 'meera123' },
    { name: 'Suresh Kumar',  role: 'Python Developer',        salary: 45000, email: 'suresh.kumar@staffflow.test',   password: 'suresh123' },
  ],
  'Cyber Security': [
    { name: 'Rajesh Tiwari', role: 'Security Analyst',        salary: 58000, email: 'rajesh.tiwari@staffflow.test',  password: 'rajesh123' },
    { name: 'Pooja Desai',   role: 'Penetration Tester',      salary: 62000, email: 'pooja.desai@staffflow.test',    password: 'pooja123' },
    { name: 'Nikhil Jain',   role: 'Network Security',        salary: 55000, email: 'nikhil.jain@staffflow.test',    password: 'nikhil123' },
    { name: 'Kavya Reddy',   role: 'Security Engineer',       salary: 59000, email: 'kavya.reddy@staffflow.test',    password: 'kavya123' },
    { name: 'Manish Yadav',  role: 'SOC Analyst',             salary: 44000, email: 'manish.yadav@staffflow.test',   password: 'manish123' },
    { name: 'Ritu Agarwal',  role: 'Compliance Officer',      salary: 48000, email: 'ritu.agarwal@staffflow.test',   password: 'ritu123' },
    { name: 'Sameer Khan',   role: 'Ethical Hacker',          salary: 56000, email: 'sameer.khan@staffflow.test',    password: 'sameer123' },
  ],
  'Design': [
    { name: 'Ishaan Malhotra',role: 'UI Designer',            salary: 42000, email: 'ishaan.malhotra@staffflow.test',password: 'ishaan123' },
    { name: 'Tanya Chopra',  role: 'UX Designer',             salary: 45000, email: 'tanya.chopra@staffflow.test',   password: 'tanya123' },
    { name: 'Harsh Pandey',  role: 'Graphic Designer',        salary: 36000, email: 'harsh.pandey@staffflow.test',   password: 'harsh123' },
    { name: 'Divya Saxena',  role: 'Product Designer',        salary: 50000, email: 'divya.saxena@staffflow.test',   password: 'divya123' },
    { name: 'Rahul Bose',    role: 'Motion Designer',         salary: 38000, email: 'rahul.bose@staffflow.test',     password: 'rahul123' },
    { name: 'Nisha Kapoor',  role: 'Brand Designer',          salary: 40000, email: 'nisha.kapoor@staffflow.test',   password: 'nisha123' },
    { name: 'Amit Srivastava',role: 'Visual Designer',        salary: 37000, email: 'amit.srivastava@staffflow.test',password: 'amit123' },
    { name: 'Preethi Menon', role: 'Interaction Designer',    salary: 43000, email: 'preethi.menon@staffflow.test',  password: 'preethi123' },
  ],
};

const getMonthKey = (monthsAgo) => {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getDaysInMonth = (monthKey) => {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month, 0).getDate();
};

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Find the test company
  const company = await Company.findOne({ email: 'indra@test.com' });
  if (!company) {
    console.log('Company not found. Make sure indra@test.com exists.');
    process.exit(1);
  }
  console.log(`Seeding for company: ${company.companyName}`);

  // Clear existing test data
  await Department.deleteMany({ company: company._id });
  await Staff.deleteMany({ company: company._id });
  await Attendance.deleteMany({ company: company._id });
  await Transaction.deleteMany({ company: company._id });
  console.log('Cleared existing data');

  // Create departments
  const createdDepts = {};
  for (const dept of departments) {
    const d = await Department.create({ ...dept, company: company._id });
    createdDepts[dept.name] = d;
    console.log(`Created department: ${dept.name}`);
  }

  // Create staff with login credentials
  const createdStaff = [];
  for (const [deptName, members] of Object.entries(staffByDept)) {
    const dept = createdDepts[deptName];
    for (const member of members) {
      const hashedPassword = await bcrypt.hash(member.password, 10);
      const s = await Staff.create({
        company: company._id,
        department: dept._id,
        name: member.name,
        role: member.role,
        salary: member.salary,
        weeklyOff: 'weekend',
        fixedAllowance: Math.round(member.salary * 0.1),
        fixedDeduction: Math.round(member.salary * 0.05),
        isActive: true,
        balance: 0,
        salaryHistory: [{ amount: member.salary, effectiveDate: new Date('2025-10-01') }],
        email: member.email,
        password: hashedPassword,
        loginEnabled: true,
      });
      createdStaff.push(s);
      console.log(`Created staff: ${member.name} (login: ${member.email} / ${member.password})`);
    }
  }

  // Generate attendance and payroll for past 6 months
  for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
    const monthKey = getMonthKey(monthsAgo);
    const [year, month] = monthKey.split('-').map(Number);
    const daysInMonth = getDaysInMonth(monthKey);
    console.log(`\nProcessing month: ${monthKey}`);

    for (const staffMember of createdStaff) {
      const attendanceRecords = {};
      let presentDays = 0, otDays = 0, halfDays = 0, absentDays = 0;
      let paidHolidayCount = 0, plCount = 0, slCount = 0, weCount = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = new Date(year, month - 1, day).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        let status;
        if (isWeekend) {
          status = 'WE';
          weCount++;
        } else {
          const rand = Math.random();
          if (rand < 0.72)      { status = 'P';  presentDays++; }
          else if (rand < 0.82) { status = 'HD'; halfDays++; }
          else if (rand < 0.87) { status = 'A';  absentDays++; }
          else if (rand < 0.92) { status = 'PL'; plCount++; }
          else if (rand < 0.96) { status = 'OT'; presentDays++; otDays++; }
          else                  { status = 'SL'; slCount++; }
        }
        attendanceRecords[dateStr] = status;
      }

      // Save attendance
      const attendanceDocs = Object.entries(attendanceRecords)
        .filter(([, status]) => status !== 'WE')
        .map(([date, status]) => ({
          updateOne: {
            filter: { staff: staffMember._id, date },
            update: { $set: { staff: staffMember._id, company: company._id, date, status } },
            upsert: true,
          }
        }));

      if (attendanceDocs.length > 0) {
        await Attendance.bulkWrite(attendanceDocs);
      }

      // Calculate salary
      const dailyRate = staffMember.salary / 30;
      const totalBasePaidDays = presentDays + weCount + paidHolidayCount + plCount + slCount + (halfDays * 0.5);
      const earnedSalary = Math.round(totalBasePaidDays * dailyRate);
      const otAmount = Math.round(otDays * dailyRate);
      const allowance = staffMember.fixedAllowance || 0;
      const deduction = staffMember.fixedDeduction || 0;
      const openingBalance = staffMember.balance || 0;
      const netPaid = earnedSalary + otAmount + allowance - deduction + openingBalance;

      const payDate = `${year}-${String(month).padStart(2, '0')}-28`;
      await Transaction.create({
        company: company._id,
        staff: staffMember._id,
        type: 'salary',
        monthKey,
        amount: netPaid > 0 ? netPaid : 0,
        earnedSalary,
        overtime: otAmount,
        bonus: allowance,
        deductions: deduction,
        openingBalance,
        closingBalance: 0,
        presentDays,
        halfDays,
        absentDays,
        paidHolidayCount,
        plCount,
        slCount,
        otDays,
        paymentMode: 'Bank',
        note: 'Monthly Salary',
        date: payDate,
      });

      await Staff.findByIdAndUpdate(staffMember._id, { balance: 0 });
      staffMember.balance = 0;
    }
    console.log(`Done month: ${monthKey}`);
  }

  console.log('\n✅ Seed complete!');
  console.log('\nSample staff logins:');
  console.log('  arjun.sharma@staffflow.test / arjun123');
  console.log('  priya.patel@staffflow.test  / priya123');
  console.log('  vikram.nair@staffflow.test  / vikram123');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
