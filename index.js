const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');

//SCHEMAS
const userModel = require('./schemas/User');
const appointmentSchema = require('./schemas/Appointment')
const offHourModel = require('./schemas/OffHour');
const sessionModel = require('./schemas/session');

const jwtSign = require('./utils/jwt-sign');
const jwtVerify = require('./utils/jwt-verify');
const tokenValidator = require('./middlewares/token-validator');

const isTimeOverlap = require('./utils/time-overlap');
const timeCompare = require('./utils/time-compare')

require('dotenv').config();

// require('dotenv').config();

const app = express();
var jsonParser = bodyParser.json()

mongoose.connect(process.env.DB_URI);

const logger = (req, res, next) => {

    let current_datetime = new Date();

    let formatted_date =
        current_datetime.getFullYear() +
        "-" +
        (current_datetime.getMonth() + 1) +
        "-" +
        current_datetime.getDate() +
        " " +
        current_datetime.getHours() +
        ":" +
        current_datetime.getMinutes() +
        ":" +
        current_datetime.getSeconds();

    let method = req.method;

    let url = req.url;

    let log = `[${formatted_date}] ${method}:${url}`;

    console.log(log);

    next();
};

app.use(cors());

app.use(logger);

app.use(jsonParser);

app.use(tokenValidator);

///////////////////////////////////////////
/////          GET REQUESTS           /////
///////////////////////////////////////////

/**
 * Search Functionality
*/
app.get('/user/:email', (req, res) => {

    let errorString = "";

    if (!req.params.email) errorString = "No email was provided";

    else if (req.params.email.length === 0) errorString = "No email was provided";

    if (errorString.length != 0) {

        res.status(400).json({ status: 400, error: { errorString }, message: "Failure", data: {} });
        return;
    }

    userModel.find({ "email": { "$regex": `${req.params.email}`, "$options": "i" } }).then((docs) => {

        if (!docs) {

            res.status(400).json({ status: 400, error: { errorString: "No users found" }, message: "Failure", docs });
            return;
        }

        if (docs.length === 0) {

            res.status(400).json({ status: 400, error: { errorString: "No users found" }, message: "Failure", docs });
            return;
        }

        res.status(200).json({ status: 200, error: { errorString }, message: "Success", data: { docs } });
    }).catch((err) => {

        res.status(400).json({ status: 400, error: { errorString: err.code }, message: "Failure", data: {} });
    });
});

app.get('/user/:email/schedules', (req, res) => {

    const { email } = req.params;

    let errorString = "";

    if (!req.params.email) errorString = "No email was provided";

    else if (req.params.email.length === 0) errorString = "No email was provided";

    if (!req.query.d) errorString = "No date was provided";

    else if (req.query.d.length === 0) errorString = "No date was provided";

    if (errorString.length != 0) {

        res.status(400).json({ status: 400, error: { errorString }, message: "Failure", data: {} });
        return;
    }

    offHourModel.find({ email, date: req.query.d }).then((docs) => {

        console.log("HIIIIIIIIIIIIIIII")
        console.log(docs)
        console.log("HIIIIIIIIIIIIIII");

        let total = [];

        if (docs) {

            total = total.concat(docs);
        }

        appointmentSchema.find({ $or: [{ hostEmail: email, date: req.query.d }, { guestEmail: email, date: req.query.d }] }).then((docs) => {

            console.log("DDDDDDDDDDDDDDDDDDDDDDDDDDDDD");
            console.log(docs);
            console.log("DDDDDDDDDDDDDDDDDDDDDDDDDDDDD");
            if (docs) {

                total = total.concat(docs);
            }

            total.sort((a, b) => {

                if (timeCompare(a.startTime, b.startTime) === "after") return 1;
                if (timeCompare(a.startTime, b.startTime) === "before") return -1;
                if (timeCompare(a.startTime, b.startTime) === "equal") return 0;
            });
            
            console.log("DDDDDDDDDDDDDDDDDDDDDDDDDDDDD");
            console.log(total);
            console.log("DDDDDDDDDDDDDDDDDDDDDDDDDDDDD");

            res.status(200).json({ status: 200, error: { errorString }, message: "Success", data: { total } });
        }).catch((err) => {

            res.status(400).json({ status: 400, error: { errorString: err.code }, message: "Failure", data: {} });
        });

    }).catch((err) => {

        res.status(400).json({ status: 400, error: { errorString: err.code }, message: "Failure", data: {} });
    });

});

app.get('/jwt/decode', jwtVerify, (req, res) => {

    const token = req.headers.authorization;

    const decoded = req.headers['vt']?.email;

    if (!decoded) {

        res.status(400).json({ status: 400, error: { errorString: "Token Invalid" }, message: "Failure", data: {} });
        return;
    }

    res.status(200).json({ status: 200, error: { errorString: "" }, message: "Success", data: { decoded } });
})

// /makeappointment/g8sdfoindf@gmail.com?key=value&key=value

/**
 * Header
 * Body
 */

///////////////////////////////////////////
/////          POST REQUESTS          /////
///////////////////////////////////////////

// AUTH

app.post('/signup', (req, res) => {

    // const { name, role, email, password } = req.body; //destructuring
    let errorString = "";

    if (!req.body.name) errorString = "No name was provided"

    else if (req.body.name.length === 0) errorString = "No name was provided"

    if (!req.body.role) errorString = "No role was provided"

    else if (req.body.role.length === 0) errorString = "No role was provided"

    if (!req.body.email) errorString = "No email was provided"

    else if (req.body.email.length === 0) errorString = "No email was provided"

    if (!req.body.password) errorString = "No password was provided"

    else if (req.body.password.length === 0) errorString = "No password was provided"

    if (errorString.length != 0) {

        res.status(400).json({ status: 400, error: { errorString }, message: "Failure", data: {} });
        return;
    }

    let hashedPassword;

    // Encryption of the string password
    bcrypt.genSalt(10, function (err, Salt) {

        // The bcrypt is used for encrypting password.
        bcrypt.hash(req.body.password, Salt, function (err, hash) {

            if (err) {
                return console.log('Cannot encrypt');
            }

            hashedPassword = hash;

            const doc = { name: req.body.name, role: req.body.role, email: req.body.email, password: hashedPassword };

            userModel.create(doc).then((result) => {

                const data = { name: result.name, role: result.role, email: result.email }
                res.status(200).json({ status: 200, error: { errorString }, message: "Success", data });

            }).catch((err) => {

                // console.log("HRIHTINNNNNNN LOGGGG")
                // console.log(err.code);
                // console.log("HRIHTINNNNNNN LOGGGG")

                if (err.code === 11000) errorString = "Email exists"
                else errorString = err.code;

                res.status(400).json({ status: 400, error: { errorString }, message: "Failure", data: {} });
            });
            // console.log(hash);
        })
    });
});

app.post('/login', (req, res) => {


    let errorString = "";
    // const { email, password } = req.body; //destructuring

    if (!req.body.email) errorString = "No email was provided"

    else if (req.body.email.length === 0) errorString = "No email was provided"

    if (!req.body.password) errorString = "No password was provided"

    else if (req.body.password.length === 0) errorString = "No password was provided"

    if (errorString.length != 0) {

        res.status(400).json({ status: 400, error: { errorString }, message: "Failure", data: {} });
        return;
    }

    userModel.findOne({ email: req.body.email }).then((doc) => {

        console.log(doc);

        if(!doc) {

            res.status(400).json({ status: 400, error: { errorString: "User does not exist" }, message: "Failure", data: {} });
            return;
        }

        const sucess = bcrypt.compareSync(req.body.password, doc.password);
        if (sucess) {

            const token = jwtSign(req.body.email);

            sessionModel.create({ email: req.body.email, token, isLoggedOut: 0 }).then((result) => {

                const data = { token }
                res.status(200).json({ status: 200, error: { errorString }, message: "Success", data });

            }).catch((err) => {

                if (err.code === 11000) errorString = "Token expired"

                else errorString = err.code;

                res.status(400).json({ status: 400, error: { errorString }, message: "Failure", data: {} });

            });

        } else res.status(400).json({ status: 400, error: { errorString: "Wrong credentials" }, message: "Failure", data: {} });
    }).catch((err) => {

        res.status(400).json({ status: 400, error: { errorString: err.code }, message: "Failure", data: {} });
    });
});

app.post('/changepassword', (req, res) => {

    let errorString = "";

    if (!req.body.email) errorString = "No email was provided"

    else if (req.body.email.length === 0) errorString = "No email was provided"

    if (!req.body.newPassword) errorString = "No password was provided"

    else if (req.body.newPassword.length === 0) errorString = "No password was provided"

    if (!req.body.oldPassword) errorString = "No old password was provided"

    else if (req.body.oldPassword.length === 0) errorString = "No old password was provided"

    if (errorString.length != 0) {

        res.status(400).json({ status: 400, error: { errorString }, message: "Failure", data: {} });
        return;
    }

    userModel.findOne({ email: req.body.email }).then((doc) => {

        if(!doc) {

            res.status(400).json({ status: 400, error: { errorString: "User does not exist" }, message: "Failure", data: {} });
            return;
        }

        const sucess = bcrypt.compareSync(req.body.oldPassword, doc.password);
        if (sucess) {

            let hashedNewPassword = "";

            // Encryption of the string password
            bcrypt.genSalt(10, function (err, Salt) {

                // The bcrypt is used for encrypting password.
                bcrypt.hash(req.body.newPassword, Salt, function (err, hash) {

                    if (err) {
                        return console.log('Cannot encrypt');
                    }

                    hashedNewPassword = hash;
                    // console.log(hash);
                })
            });

            userModel.updateOne({ email: req.body.email }, { password: hashedNewPassword }).then((doc) => {

                res.status(200).json({ status: 200, error: { errorString }, message: "Success", data: {} });

            }).catch((err) => {

                res.status(400).json({ status: 400, error: { errorString: err.code }, message: "Failure", data });
            })

        } else res.status(400).json({ status: 400, error: { errorString: "Wrong credentials" }, message: "Failure", data: {} });

    }).catch((err) => {

        res.status(400).json({ status: 400, error: { errorString: err.code }, message: "Failure", data: {} });
    });

});

app.post('/logout', (req, res) => {

    let errorString = "";

    const token = req.headers.authorization;

    sessionModel.updateOne({ token }, { isLoggedOut: 1 }).then((doc) => {

        const data = { token }
        res.status(200).json({ status: 200, error: { errorString }, message: "Success", data });

    }).catch((err) => {

        res.status(400).json({ status: 400, error: { errorString: err.code }, message: "Failure", data: {} });
    })
});

//Schedule Endpoints

app.post('/markoffhours', jwtVerify, (req, res) => {

    let errorString = "";

    if (!req.body.title) errorString = "No title was provided"

    else if (req.body.title.length === 0) errorString = "No title was provided"

    if (!req.query.d) errorString = "No date was provided"

    else if (req.query.d.length === 0) errorString = "No date was provided"

    if (!req.query.t1) errorString = "No time was provided"

    else if (req.query.t1.length === 0) errorString = "No time was provided"

    if (!req.query.t2) errorString = "No time was provided"

    else if (req.query.t2.length === 0) errorString = "No time was provided"

    const email = req.headers['vt']?.email;

    if (!email) errorString = "Token was invalid"

    if (errorString.length != 0) {

        res.status(400).json({ status: 400, error: { errorString }, message: "Failure", data: {} });
        return;
    }

    offHourModel.find({ email, date: req.query.d }).then((docs) => {

        let overlap = false;

        if (docs.length > 0) {

            for (let doc of docs) {

                const t1 = {
                    start: doc.startTime,
                    end: doc.endTime
                };

                const t2 = {
                    start: req.query.t1,
                    end: req.query.t2
                };

                if (isTimeOverlap(t1, t2)) {

                    overlap = true;
                    break;
                }
            }
        }

        if (overlap) {

            res.status(400).json({ status: 400, error: { errorString: "Already Off-Hour in these hours" }, message: "Failure", data: {} });
            return null;
        }

        return appointmentSchema.find({ $or: [{ hostEmail: email, date: req.query.d }, { guestEmail: email, date: req.query.d }] });

    }).then((docs) => {

        if (!docs) return;

        let overlap = false;

        if (docs.length > 0) {

            for (let doc of docs) {

                const t1 = {
                    start: doc.startTime,
                    end: doc.endTime
                };

                const t2 = {
                    start: req.query.t1,
                    end: req.query.t2
                };

                if (isTimeOverlap(t1, t2)) {

                    overlap = true;
                    break;
                }
            }
        }

        if (overlap) {

            res.status(400).json({ status: 400, error: { errorString: "Appointments are there in these hours" }, message: "Failure", data: {} });
            return null;
        }

        const newDoc = {
            title: req.body.title,
            date: req.query.d,
            startTime: req.query.t1,
            endTime: req.query.t2,
            email
        }

        return offHourModel.create(newDoc)

    }).then((doc) => {

        if (!doc) return;

        res.status(200).json({ status: 200, error: { errorString }, message: "Success", data: doc });

    }).catch((err) => {

        res.status(400).json({ status: 400, error: { errorString: err.code }, message: "Failure", data: {} });
    });

});

app.post('/makeappointment/:guestEmail', jwtVerify, (req, res) => {

    let errorString = "";

    if (!req.params.guestEmail) errorString = "No guest email was provided"

    else if (req.params.guestEmail.length === 0) errorString = "No guest email was provided"

    if (!req.body.title) errorString = "No title was provided"

    else if (req.body.title.length === 0) errorString = "No title was provided"

    if (!req.body.agenda) errorString = "No agenda was provided"

    else if (req.body.agenda.length === 0) errorString = "No agenda was provided"

    if (!req.query.d) errorString = "No date was provided"

    else if (req.query.d.length === 0) errorString = "No date was provided"

    if (!req.query.t1) errorString = "No time was provided"

    else if (req.query.t1.length === 0) errorString = "No time was provided"

    if (!req.query.t2) errorString = "No time was provided"

    else if (req.query.t2.length === 0) errorString = "No time was provided"

    const hostEmail = req.headers['vt']?.email;

    if (!hostEmail) errorString = "Token was invalid"

    if (errorString.length != 0) {

        res.status(400).json({ status: 400, error: { errorString }, message: "Failure", data: {} });
        return;
    }

    offHourModel.find({ $or: [{ email: hostEmail, date: req.query.d }, { email: req.params.guestEmail, date: req.query.d }] }).then((docs) => {

        console.log("OffH", docs);

        let overlap = false;

        if (docs.length > 0) {

            for (let doc of docs) {

                const t1 = {
                    start: doc.startTime,
                    end: doc.endTime
                };

                const t2 = {
                    start: req.query.t1,
                    end: req.query.t2
                };

                if (isTimeOverlap(t1, t2)) {

                    overlap = true;
                    break;
                }
            }
        }

        if (overlap) {

            res.status(400).json({ status: 400, error: { errorString: "Already Off-Hour in these hours" }, message: "Failure", data: {} });
            return null;
        }

        return appointmentSchema.find({ $or: [{ hostEmail: hostEmail, date: req.query.d }, { guestEmail: hostEmail, date: req.query.d }, { hostEmail: req.params.guestEmail, date: req.query.d }, { guestEmail: req.params.guestEmail, date: req.query.d }] });

    }).then((docs) => {

        console.log("APPT", docs);

        if (!docs) return null;

        let overlap = false;

        if (docs.length > 0) {

            for (let doc of docs) {

                const t1 = {
                    start: doc.startTime,
                    end: doc.endTime
                };

                const t2 = {
                    start: req.query.t1,
                    end: req.query.t2
                };

                if (isTimeOverlap(t1, t2)) {

                    overlap = true;
                    break;
                }
            }
        }

        if (overlap) {

            res.status(400).json({ status: 400, error: { errorString: "Appointments are there in these hours" }, message: "Failure", data: {} });
            return null;
        }

        const newDoc = {
            title: req.body.title,
            agenda: req.body.agenda,
            date: req.query.d,
            startTime: req.query.t1,
            endTime: req.query.t2,
            hostEmail,
            guestEmail: req.params.guestEmail
        }

        return appointmentSchema.create(newDoc)

    }).then((doc) => {

        if (!doc) return;

        res.status(200).json({ status: 200, error: { errorString }, message: "Success", data: doc });

    }).catch((err) => {

        res.status(400).json({ status: 400, error: { errorString: err.code }, message: "Failure", data: {} });

    });
});

app.listen(process.env.PORT, () => console.log(`TerraScheduler listening on port ${process.env.PORT}!`));