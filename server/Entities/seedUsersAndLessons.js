
// התחברות למסד הנתונים
const uri = "mongodb+srv://root:root@cluster0.9nu60.mongodb.net/feck?retryWrites=true&w=majority&appName=Cluster0";;

const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker/locale/he');
const { v4: uuidv4 } = require('uuid');

// ✅ ייבוא מודלים קיימים
const User = require('./User/User.model');
const Lesson = require('./Lesson/Lesson.model');

async function seed() {
  try {
    console.log("connecting with db");
    
    try{
            const conn = await mongoose.connect(uri);
            console.log(`MongoDB Connected: ${conn.connection.host}`.green);
            ////console.log("***************end - connectDB************")
        }
        catch(err){
            console.log("ErrorMongoDB ", err)
            return;
        }
       //console.log("***************end - connectDB************")

    const now = new Date();
    const users = [];
    console.log("start create");
    // מנהל
    const manager = new User({
      tz: faker.string.numeric(9),
      username: 'm1',
      password: '123',
      firstname: faker.person.firstName('male'),
      lastname: faker.person.lastName(),
      birth_date: faker.date.birthdate({ min: 25, max: 45, mode: 'age' }).toISOString().split('T')[0],
      gender: 'זכר',
      phone: faker.phone.number(),
      email: faker.internet.email(),
      city: faker.location.city(),
      street: faker.location.street(),
      role: 'מנהל',
      list_class: [],
      created: now,
      updated: now,
    });

    users.push(manager);

    console.log("create users admin");
    
    // מאמנים
    const trainers = [];
    for (let i = 1; i <= 2; i++) {

      const trainer = new User({
        tz: faker.string.numeric(9),
        username: `tr${i}`,
        password: '123',
        firstname: faker.person.firstName('male'),
        lastname: faker.person.lastName(),
        birth_date: faker.date.birthdate({ min: 25, max: 45, mode: 'age' }).toISOString().split('T')[0],
        gender: 'זכר',
        phone: faker.phone.number(),
        email: faker.internet.email(),
        city: faker.location.city(),
        street: faker.location.street(),
        role: 'מאמן',
        max_class: faker.number.int({ min: 3, max: 6 }),
        list_class: [],
        created: now,
        updated: now,
      });
      users.push(trainer);
      trainers.push(trainer);
    }

    console.log("create users trainers");
    
    // מתאמנים
    const trainees = [];
    for (let i = 1; i <= 10; i++) {
      const trainee = new User({
        tz: faker.string.numeric(9),
        username: `te${i}`,
        password: '123',
        firstname: faker.person.firstName('female'),
        lastname: faker.person.lastName(),
        birth_date: faker.date.birthdate({ min: 25, max: 45, mode: 'age' }).toISOString().split('T')[0],
        gender: 'נקבה',
        phone: faker.phone.number(),
        email: faker.internet.email(),
        city: faker.location.city(),
        street: faker.location.street(),
        role: 'מתאמן',
        max_class: faker.number.int({ min: 1, max: 3 }),
        list_class: [],
        created: now,
        updated: now,
      });
      users.push(trainee);
      trainees.push(trainee);
    }

        console.log("create users trainees");

    // שמור את המשתמשים
    await User.insertMany(users);
    console.log('👥 Users inserted');

    // שיעורים
    const lessons = [];
    for (let i = 0; i < 5; i++) {
      const trainer = faker.helpers.arrayElement(trainers);
      const maxTrainees = faker.number.int({ min: 2, max: 5 });
      const selectedTrainees = faker.helpers.arrayElements(trainees, faker.number.int({ min: 1, max: maxTrainees }));

      const lesson = new Lesson({
        name: `L${i + 1}`,
        date: {
          day: faker.number.int({ min: 0, max: 6 }),
          hh: faker.number.int({ min: 8, max: 20 }),
        },
        max_trainees: maxTrainees,
        num_in_list: selectedTrainees.length,
        trainer: trainer._id,
        list_trainees: selectedTrainees.map(t => t._id),
        created: now,
        updated: now,
      });

      lessons.push(lesson);

      // עדכון משתמשים
      trainer.list_class.push(lesson._id);
      selectedTrainees.forEach(t => t.list_class.push(lesson._id));
    }

    // שמור את השיעורים
    await Lesson.insertMany(lessons);
    await Promise.all([...trainers, ...trainees].map(u => u.save()));

    console.log('📘 Lessons inserted and linked');
  } catch (err) {
    console.error('❌ Seeding error:', err);
  } finally {
    mongoose.connection.close();
  }
}

seed();
