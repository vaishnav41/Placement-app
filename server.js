const express=require('express');
const app=express();
const cookieParser=require('cookie-parser');
const cookie=require('cookie');
const dotenv=require('dotenv');
const pdfParse=require('pdf-parse');
var bodyParser = require("body-parser");
dotenv.config();
var multer = require('multer');
var upload = multer();
var session = require('express-session');
var flash = require('connect-flash');
app.set("view-engine","ejs"); // to instantiate
const connection = require('./config/db');
var cors = require('cors');
app.use(cors('*'));
var nm = require('nodemailer');
let savedOTPS = {

};
var auth;

var deptt = "";

app.use(cookieParser());
app.use(express.static(__dirname + "/frontend"));
app.use(express.static(__dirname + "/views"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(upload.array()); 
app.use(express.static('public'));

app.get("/", (req,res) => {
    res.redirect("/index.html");
});

app.get("/Login", (req,res) => {
    res.redirect("/LOGIN-sessional.html");
});

app.get("/PersonalDetails", (req,res) => {
    res.redirect("/PersonalDetails.html");
});


app.get("/ApplyforJob", (req,res) => {
    var stu = req.query.reg;
    var dept = req.query.branch;
    var dream = req.query.dream;
    var general = req.query.general;
    var grad = req.query.graduation;
    console.log(stu,dept);
    if(general == 0 && dream != 1)
    {
        connection.query(`select * from jobs where verified = 1 and gpa<${grad}`, (err,rows) => {
            if(err) {console.log(err);}
            else {
                console.log(rows);
                connection.query(`select jobid from applied where RegisterNo = ${stu}`, (err,rows2) => {
                    if(err) {console.log(err);}
                    else {
                        const jobIds = rows2.map(obj => obj.jobid);
                        res.render("ApplyJob.ejs", {rows, stu, dept, jobIds});
                    }
                });
            }
        });
    }
    else if(general == 1 && dream == 0)
    {
        connection.query(`select * from jobs where verified = 1 and dream = 1 and gpa<${grad}`, (err,rows) => {
            if(err) {console.log(err);}
            else {
                console.log(rows);
                connection.query(`select jobid from applied where RegisterNo = ${stu}`, (err,rows2) => {
                    if(err) {console.log(err);}
                    else {
                        const jobIds = rows2.map(obj => obj.jobid);
                        res.render("ApplyJob.ejs", {rows, stu, dept, jobIds});
                    }
                });
            }
        }); 
    }
    else{
        res.redirect("/alert");
    }


});

app.get("/Appytothis", (req,res) => {
    var jobid = req.query.jobid;
    var RegisterNo = req.query.regno;
    try {
        connection.query("INSERT INTO applied (RegisterNo,jobid) values(?,?)",
         [RegisterNo,jobid], 
         (err,rows) => {
            if (err) {
                console.log(err);
            }
            else {
                res.redirect("/alert");
            }
        });

    } catch (err) {
        console.log(err);
    }
});



//////new/////
app.post("/ScheduleCompany", (req,res) => {
    console.log(req.body);
    const dates= req.body.dates;
    const jobid = req.body.jobid;
    const registerno = req.body.registerno;
    const events=req.body.events;
    try {
        connection.query("INSERT INTO schedules (events,dates,jobid,RegisterNo) values(?,?,?,?)",
         [events,dates,jobid,registerno], 
         (err,rows) => {
            if (err) {
                console.log(err);
            }
            else {
                connection.query(`UPDATE applied SET status = "${events}" WHERE RegisterNo = ${registerno} and jobid = ${jobid}`, (err,rows) => {
                    if(err) {console.log(err);}
                    else {
                        res.redirect("/alert");
                    }
                });
                // res.redirect("/alert");
            }
        });

    } catch (err) {
        console.log(err);
    }
});
//////new///////
app.get("/CompanyHome", (req,res) => {

    res.redirect("CompanyHome.html");
});


app.get("/alert", (req,res) => {
    res.redirect("Alert.html");
});



app.get("/fetch",(req,res,next) => {
    connection.query("select * from students order by FirstName ASC ", (err,rows) => {
        if(err) {
            console.log(err);
        }
        else {
            res.render("deptdata.ejs", { rows, selecteddept: deptt } );
            console.log(deptt);
        }
    })
});
app.post("/", (req, res) => {
    deptt = req.body.department;
    res.redirect("/fetch");
});



app.get("/data",(req,res) => {
    connection.query(" select * from students", (err,rows) => {
        if(err) {
            console.log(err);
        }
        else {
            res.render("read.ejs", {rows} );
        }
    });
});

//////Students Begin//////
app.get("/Calendar", (req,res) => {
    var regno = req.query.reg;
    var currentmonth = req.query.currm;
    var selectthis = [];
    // var selecdate = [];
    connection.query(`select * from schedules where RegisterNo = ${regno}`, (err,schedule) => {
        if(err) {
            console.log(err);
        }
        else {
            for(let i = 0; i<schedule.length; i++)
            {
                selectthis.push(schedule[i].jobid);
            }
            // for(let i = 0;i< schedule.length ; i++) {selecdate.push(schedule[i].dates);}
            // console.log(selecdate);
            connection.query(`select * from jobs where jobid IN (${selectthis.join(",")})`, (err,jobber) => {
                if(err) {
                    console.log(err);
                }
                else {
                    // console.log(schedule[0].events,schedule[1].events,jobber[0].compname,jobber[1].compname);
                    res.render("ViewSchedule.ejs", {schedule , jobber, currentmonth , regno});
                }
            });
        }
    });
});

app.get('/updatestudent', function(req, res) {
    const regno = req.cookies.regno;
    connection.query('SELECT * FROM placement.students WHERE RegisterNo = ?', [regno], function(error, results) {
      if (error) {
        throw error;
      }
      console.log(results);
      res.render('updatestudent.ejs', {data: results});
    });
  });

app.post('/updatestudent', function(req, res){
    console.log(req.body);
    var phn = req.body['phn'];
    var altno = req.body['altno'];
    var grad = req.body['grad'];
    var pg = req.body['pg'];
    var backlog = req.body['backlog'];
    var history = req.body['history'];
    var resume = req.body['resume'];
    var intern = req.body['intern'];
    var address = req.body['address'];
    var state = req.body['state'];
    var country = req.body['country'];
    var file = req.body['file-upload'];
    var regno = req.cookies.regno;

    // Retrieve existing student data
    connection.query(`SELECT * FROM placement.students WHERE RegisterNo=${regno}`, function(err, result) {
        if (err) throw err;
        console.log(result);

        // Use existing values if new values are not provided
        phn = phn || result[0].MobileNo;
        altno = altno || result[0].alternateMobile;
        grad = grad || result[0].graduation;
        pg = pg || result[0].pg;
        backlog = backlog || result[0].currentbacklogs;
        history = history || result[0].history;
        resume = resume || result[0].resumelink;
        intern = intern || result[0].InternshipDet;
        address = address || result[0].AddressPermanent;
        state = state || result[0].state;
        country = country || result[0].country;

        // Update student data
        let sql = `UPDATE placement.students SET MobileNo='${phn}', resumelink='${resume}', graduation='${grad}', pg='${pg}', history='${history}' , currentbacklogs='${backlog}' WHERE RegisterNo=${regno}`;
        connection.query(sql, function(err, result){
            if (err) throw err;
            console.log('updated');
            res.redirect('/studenthome');
        });
    });
});


app.post("/PersonalDetails", (req, res) => {
    console.log(req.body);
    const registerno = req.body.registerno;
    const email=req.body.email;
    const name = req.body.name;
    const lName= req.body.lName;
    const department = req.body.department;
    const mobile = req.body.mobile;
    const alternateMobile = req.body.alternateMobile;
    const tenth =req.body.tenth;
    const twelth=req.body.twelth;
    const diploma=req.body.diploma;
    const grad=req.body.grad;
    const pg=req.body.pg;
    const cb=req.body.cb;
    const hs=req.body.hs;
    const resume=req.body.resume;
    const yop=req.body.yop;
    const intern=req.body.intern;
    const addr=req.body.addr;
    const state=req.body.state;
    const country=req.body.country;
    const password=req.body.password;
    const mothert=req.body.mothert;
    const gap=req.body.gap;
    const dob=req.body.dob;
    const langknown=req.body.langknown;
    try {
        connection.query("INSERT INTO students (RegisterNo,email,FirstName,LastName,Department,MobileNo,alternateMobile,Stdten,stdtwe,diploma,graduation,pg,currentbacklogs,history,resumelink,YearOfPassing,InternshipDet,AddressPermanent,state,country,password,mothert,gap,dob,langknown) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
         [registerno,email,name,lName,department,mobile,alternateMobile,tenth,twelth,diploma,
        grad,pg,cb,hs,resume,yop,intern,addr,state,country,password,mothert,gap,dob,langknown], 
         (err,rows) => {
            if (err) {
                console.log(err);
            }
            else {
                res.redirect("alert");
            }
        });

    } catch (err) {
        console.log(err);
    }
});

app.post('/student', function(req, res){
    console.log(req.body);
    const reg  = req.body['regno'];
    var pass = req.body['pass'];
    connection.query(`select * from placement.students where RegisterNo= '${reg}'`,function(err,resp){
        console.log(resp);
        if(err) throw err;
        else{ 
            if(resp.length === 0)
            {
                res.redirect(401,'/Login'); 
            } 
           else
            {console.log(resp[0]['password'])
            if (pass == resp[0]['password']){
                console.log('Access granted');
                res.cookie('regno',reg,{
                        maxAge: 100000,
                        secure: true,
                });
                res.redirect('/studenthome');
            }
            else{
                console.log('Password Incorrect');
                //res.send('Incorrect password');
                res.redirect(401,'/Login');
            }}
        }
     })
});

// app.post('/register', function(req, res){
//     console.log(req.body);
//     var reg  = req.body['regno'];
//     var pass = req.body['pass'];
//     var email = req.body['email'];
//     var transporter = nm.createTransport(
//         {
//             host: "smtp.gmail.com",
//             port: 587,
//             secure: false,
//             auth: {
//                 user: 'gautamvarada80@gmail.com',
//                 pass: 'obewqirrnbrlasdv'
//             }
//         }
//     );

//     app.post('/sendotp', (req, res) => {
//         let email = req.body.email;
//         let digits = '0123456789';
//         let limit = 4;
//         let otp = ''
//         for (i = 0; i < limit; i++) {
//             otp += digits[Math.floor(Math.random() * 10)];
    
//         }
//         var options = {
//             from: 'gautamvarada80@gmail.com',
//             to: `${email}`,
//             subject: "Testing node emails",
//             html: `<p>Enter the otp: ${otp} to verify your email address</p>`
    
//         };
//         transporter.sendMail(
//             options, function (error, info) {
//                 if (error) {
//                     console.log(error);
//                     res.status(500).send("couldn't send")
//                 }
//                 else {
//                     savedOTPS[email] = otp;
//                     setTimeout(
//                         () => {
//                             delete savedOTPS.email
//                         }, 60000
//                     )
//                     res.send("sent otp")
//                 }
    
//             }
//         )
//     })
    
//     app.post('/verify', (req, res) => {
//         let otprecived = req.body.otp;
//         let email = req.body.email;
//         if (savedOTPS[email] == otprecived) {
//             auth=1;
//             res.send("Verfied");
//         }
//         else {
//             auth=0;
//             res.status(500).send("Invalid OTP")
//         }
//         console.log(auth);
//     })
    
//     connection.query(`select * from placement.students where RegisterNo= '${reg}'`,function(err,resp){
//         console.log(resp);
//         if(err) throw err;
//         else{ 
//             if(resp.length === 0)
//             {
//                 if(email === undefined)
//                 res.redirect('/Login');
//             }
//                 else{
//                     connection.query(`insert into placement.students(RegisterNo,password)values('${reg}','${pass}')`,function(err,resp){
//                         if(err)console.log('Error')
//                         else{
//                             console.log('posted');
//                             res.redirect('/Login');
//                         }
//                     })     
//                 }
//             }         
//     })
// });


app.post('/register', function(req, res){
    console.log(req.body);
    var reg  = req.body['regno'];
    var pass = req.body['pass'];
    var email = req.body['email'];
    connection.query(`select * from placement.student_login where RegNo= '${reg}'`,function(err,resp){
        console.log(resp);
        if(err) throw err;
            if(resp.length === 0)
            {
                if(email === undefined)
                res.redirect('\LOGIN-sessional.html');
                else{
                    connection.query(`insert into placement.student_login(RegNo,Password)values('${reg}','${pass}')`,function(err,resp){
                        if(err)console.log('Error')
                        console.log('posted');
                        res.redirect('\LOGIN-sessional.html');
                        
                    })    
                }
            }         
    })
});


app.get('/studenthome',function(req,res){
    const reg=req.cookies;
    connection.query(`select * from placement.students where RegisterNo='${reg['regno']}'`, function(err,result){
      if(err) throw err;
      console.log(result);
      res.render('studenthome.ejs',{'data':result});
    });
});

app.get('/Logoutstudent',function(req,res){
    res.clearCookie('regno');
    res.redirect('/LOGIN-sessional.html');
});
/////////Student End//////

////////Company Module Begin//////
app.get("/companyreg",(req,res) => {
    res.redirect("companyreg.html");
});

app.get("/PostJob", (req,res) => {
    var companyid = req.query.compid;
    var companyname = req.query.compname;
    res.render("PostJob.ejs" , {comp: companyid,compname: companyname});
});

app.get("/JobHome", (req,res) => {
    var job = req.query.jobid;
    connection.query(`select * from jobs where jobid = ${job}`, (err,rows) => {
        if(err) {
            console.log(err);
        }
        else {
            res.render("JobsHomepage.ejs", { rows } );
        }
    })
});

app.get("/ScheduleCompany", (req,res) => {
    var jobid = req.query.jobid;
    connection.query(`select * from applied where jobid = ${jobid}`, (err, jobs) => {
        if (err) {
          console.log(err);
        } else {
          connection.query(`select * from students`, (err, students) => {
            if (err) {
              console.log(err);
            } else {
              const matchedRows = students.filter(student => {
                return jobs.some(job => {
                  return job.RegisterNo === student.RegisterNo;
                });
              });
              res.render("SchedulingCompany.ejs", {matchedRows,jobs,jobid});
            }
          });
        }
      });
});


app.post("/companyreg", (req, res) => {
    console.log(req.body);
    const email = req.body.email;
    const name = req.body.name;
    const hrname= req.body.hrname;
    const location = req.body.location;
    const category = req.body.category;
    const Password = req.body.Password;
    try {
        connection.query("INSERT INTO company (mail,name,hrname,hqloc,category,password) values(?,?,?,?,?,?)",
         [email,name,hrname,location,category,Password], 
         (err,rows) => {
            if (err) {
                console.log(err);
            }
            else {
                res.redirect("/alert");
            }
        });

    } catch (err) {
        console.log(err);
    }
});


app.post("/PostJob", (req, res) => {
    console.log(req.body);
    const compid = req.body.companyid;
    const compname = req.body.companyname;
    const pos = req.body.pos;
    const ctc=req.body.ctc;
    const Under = req.body.Under;
    const cgpa= req.body.cgpa;
    const  branch= req.body.branch;
    const location=req.body.location;
    const file=req.body.file;
    try {
        connection.query("INSERT INTO jobs (companyId,compname,position,offer,percentage,gpa,branch,location,file) values(?,?,?,?,?,?,?,?,?)",
         [compid,compname,pos,ctc,Under,cgpa,branch,location,file], 
         (err,rows) => {
            if (err) {
                console.log(err);
            }
            else {
                connection.query(` UPDATE jobs SET generalp = CASE WHEN offer < 6 THEN 1 ELSE 0 END, dream = CASE WHEN offer > 6 THEN 1 ELSE 0 END;`);
                res.send("/alert");
            }
        });

    } catch (err) {
        console.log(err);
    }
});


app.post('/recruiter',function(req,res){
    console.log(req.body);
    var pass = req.body['pass'];
    var email = req.body['email'];
    connection.query(`select * from placement.company where mail= '${email}'`,function(err,resp){
        console.log(resp);
        if(err) throw err;
        else if(resp.length === 0)
            {
                res.redirect(401,'/Login');
            } 
        else
            {
            console.log(resp[0]['password'])
            if (pass == resp[0]['password']){
                console.log('Access granted');
                res.cookie('Email',email,{
                    maxAge: 100000,
                    secure: true,
                });
                res.redirect('/recruiterhome');
            }
            else{
                console.log('Password Incorrect');
                //res.send('Incorrect password');
                res.redirect(401,'/Login');
            }}
    })
});

app.get('/recruiterhome',function(req,res){
    const email=req.cookies;
    console.log(typeof(email['Email']));
    connection.query(`select * from placement.company where mail='${email['Email']}'`, function(err,result){
      if(err) throw err;
      console.log(result);
      let compid = result[0].companyId;
      connection.query(`select * from placement.jobs where companyId=${compid}`,function(err,result2){
        if(err) throw err;
        console.log(result2);
          res.render('recruiterhome.ejs',{'data':result, 'job':result2});
      });
    });
});

app.get('/Logoutrecruiter',function(req,res){
    res.clearCookie('Email');
    res.redirect('/LOGIN-sessional.html');
});
/////////Recruiter Module End////////




////////Coordinator Module Begin//////

app.get("/verifycompany",(req,res,next) => {
    var crname = req.query.crname;
    connection.query("select * from company order by companyId ASC", (err,rows) => {
        if(err) {
            console.log(err);
        }
        else {
            res.render("VERIFYrecruiters.ejs", { rows , crname : crname} );
        }
    })
});

app.get("/verifyjobs",(req,res,next) => {
    var crname = req.query.crname;
    connection.query("select * from jobs order by jobid ASC", (err,rows) => {
        if(err) {
            console.log(err);
        }
        else {
            res.render("VERIFYjobs.ejs", { rows , crname: crname} );
        }
    })
});

app.get("/verifystudents",(req,res,next) => {
    var crname = req.query.crname;
    connection.query("select * from students order by RegisterNO ASC", (err,rows) => {
        if(err) {
            console.log(err);
        }
        else {
            res.render("VERIFYstudents.ejs", { rows , selecteddept: deptt , crname: crname} );
            console.log(deptt);
        }
    })
});

app.get("/studentdetails",(req,res,next) => {
    var roll = req.query.regid;
    var crname = req.query.crname;
    connection.query("select * from students order by RegisterNO ASC", (err,rows) => {
        if(err) {
            console.log(err);
        }
        else {
            res.render("ShowStuDetails.ejs", { rows , selectedreg: roll , crname: crname} );
            console.log(roll);
        }
    })
});


app.get("/verifythis",(req,res,next) => {
    var roll = req.query.regid;
    connection.query(`UPDATE students SET verified = 1 WHERE RegisterNo = ${roll}`, (err,rows) => {
        if(err) {
            console.log(err);
        }
        else {
            res.render("AlertVerified.ejs", { rows , selectedreg: roll} );
            console.log(roll);
        }
    })
});

app.get("/companydetails",(req,res,next) => {
    var company = req.query.compid;
    connection.query("select * from company order by companyId ASC", (err,rows) => {
        if(err) {
            console.log(err);
        }
        else {
            res.render("ShowCompDetails.ejs", { rows , selectedcomp: company} );
        }
    })
});

app.get("/verifythisrecruiter",(req,res,next) => {
    var company = req.query.compid;
    connection.query(`UPDATE company SET verified = 1 WHERE companyId = ${company}`, (err,rows) => {
        if(err) {
            console.log(err);
        }
        else {
            res.render("AlertVerified1.ejs", { rows , selectedreg: company} );
        }
    })
});

app.get("/verifythisjob",(req,res,next) => {
    var job = req.query.jobid;
    connection.query(`UPDATE jobs SET verified = 1 WHERE jobid = ${job}`, (err,rows) => {
        if(err) {
            console.log(err);
        }
        else {
            res.render("AlertVerified2.ejs", { rows , selectedreg: job} );
        }
    })
});

app.post("/", (req, res) => {
    deptt = req.body.department;
    res.redirect("/verifystudents");
});

app.post('/coordinator',function(req,res){
    console.log(req.body);
    var pass = req.body['pass'];
    var email = req.body['email'];
    connection.query(`select * from placement.coordinators where email= '${email}'`,function(err,resp){
        console.log(resp);
        if(resp.length === 0)
            {
                res.redirect(401,'/Login');
            } 
           else
            {
            console.log(resp[0]['password'])
            if (pass == resp[0]['password']){
                console.log('Access granted');
                res.cookie('Email',email,{
                    maxAge: 100000,
                    secure: true,
                });
                res.redirect('/coordinatorhome');
            }
            else{
                console.log('Password Incorrect');
                //res.send('Incorrect password');
                res.redirect(401,'/Login');
            }}
    })
});


app.get('/coordinatorhome',function(req,res){
    const email=req.cookies;
    connection.query(`select * from placement.coordinators where email='${email['Email']}'`, function(err,result){
      if(err) throw err;
      console.log(result);
      res.render('coordinatorhome.ejs',{'data':result});     
    });
});

app.get('/Logoutcoordinator',function(req,res){
    res.clearCookie('Email');
    res.redirect('/LOGIN-sessional.html');
});
////////coordinator Module End////////

app.listen(process.env.PORT || 4000, (error)=>{
    if (error) throw error;

    console.log(`server running on ${process.env.PORT}`);
});

