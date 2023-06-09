import serverless from 'serverless-http'
import express from 'express'
// import mysql from 'mysql'
import mysql from 'serverless-mysql'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import LogUtil from './logUtil.js'

const logger = LogUtil.getLogger();

const app = express();
app.use(cors(
    {
        origin: ["http://localhost:3000", "http://hrms-test1.s3-website.ap-south-1.amazonaws.com"],
        methods: ["POST", "GET", "PUT", "DELETE"],
        credentials: true
    }
));
app.use(cookieParser());
app.use(express.json());
app.use(express.static('public'));

const {DB_DOMAIN, DB_USER, DB_PASSWORD, DATABASE, JWT_SECRET_KEY} = process.env

// const con = mysql.createConnection({
//     host: DB_DOMAIN,
//     user: DB_USER,
//     password: DB_PASSWORD,
//     database: DATABASE
// })
const con = mysql({
    config: {
      host     : DB_DOMAIN,
      database : DATABASE,
      user     : DB_USER,
      password : DB_PASSWORD
    }
  })

// con.connect(function(err) {
//     if(err) {
//         logger.error('Failed to connect to DB')
//         logger.error(err)
//     } else {
//         logger.info('Connected to DB')
//     }
// })

app.get('/getEmployee', (req, res) => {
    logger.info('Calling /getEmployee endpoint')
    const sql = "SELECT * FROM employee";
    con.query(sql, async (err, result) => {
        if(err) {
            logger.error(err)
            return res.json({Error: "Get employee error in sql"});
        }
        await con.end()
        return res.json({Status: "Success", Result: result})
    })

})

const verifyUser = (req, res, next) => {
    logger.info('Verifying user')
    const token = req.headers.token;
    if(!token) {
        return res.json({Error: "You are not Authenticated"});
    } else {
        jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
            if(err) {
                logger.error(err)
                return res.json({Error: "Token wrong"});
            }
            req.role = decoded.role;
            req.id = decoded.id;
            next();
        } )
    }
}

app.get('/get/:id', verifyUser, (req, res) => {
    logger.info('Calling /get/:id endpoint')
    const id = req.params.id;
    const sql = "SELECT * FROM employee where id = ?";
    con.query(sql, [id], async (err, result) => {
        if(err) {
            logger.error(err)
            return res.json({Error: "Get employee error in sql"});
        }
        await con.end()
        return res.json({Status: "Success", Result: result})
    })
})

app.put('/update/:id', (req, res) => {
    logger.info('Calling /update/:id endpoint')
    const id = req.params.id;
    const sql = "UPDATE employee set salary = ? WHERE id = ?";
    con.query(sql, [req.body.salary, id], async (err, result) => {
        if(err) {
            logger.error(err);
            return res.json({Error: "update employee error in sql"});
        }
        await con.end()
        return res.json({Status: "Success"})
    })
})

app.delete('/delete/:id', (req, res) => {
    logger.info('Calling /delete/:id endpoint')
    const id = req.params.id;
    const sql = "Delete FROM employee WHERE id = ?";
    con.query(sql, [id], async (err, result) => {
        if(err) {
            logger.error(err)
            return res.json({Error: "delete employee error in sql"});
        }
        await con.end()
        return res.json({Status: "Success"})
    })
})

app.get('/dashboard',verifyUser, (req, res) => {
    logger.info('Calling /dashboard endpoint')
    return res.json({Status: "Success", role: req.role, id: req.id})
})

app.get('/adminDetails', (req, res) => {
    logger.info('Calling /adminDetails endpoint')
    const sql = "Select email from users";
    con.query(sql, async (err, result) => {
        if(err) {
            logger.error(err)
            return res.json({Error: "Error in runnig query"});
        }
        await con.end()
        return res.json(result);
    })
})
app.get('/employeeCount', (req, res) => {
    logger.info('Calling /employeeCount endpoint')
    const sql = "Select count(id) as employee from employee";
    con.query(sql, async (err, result) => {
        if(err) {
            logger.error(err)
            return res.json({Error: "Error in runnig query"});
        }
        await con.end()
        return res.json(result);
    })
})

app.get('/salary', (req, res) => {
    logger.info('Calling /salary endpoint')
    const sql = "Select sum(salary) as sumOfSalary from employee";
    con.query(sql, async (err, result) => {
        if(err) {
            logger.error(err)
            return res.json({Error: "Error in runnig query"});
        }
        await con.end()
        return res.json(result);
    })
})

app.post('/login', (req, res) => {
    logger.info('Calling /login endpoint')
    const sql = "SELECT * FROM users Where email = ? AND  password = ?";
    con.query(sql, [req.body.email, req.body.password], async (err, result) => {
        if(err) {
            logger.error(err)
            return res.json({Status: "Error", Error: "Error in runnig query"});
        }
        if(result.length > 0) {
            const id = result[0].id;
            const token = jwt.sign({role: "admin"}, JWT_SECRET_KEY, {expiresIn: '1d'});
            res.cookie('token', token);
            await con.end()
            return res.json({Status: "Success", token})
        } else {
            await con.end()
            return res.json({Status: "Error", Error: "Wrong Email or Password"});
        }
        
    })
})

app.post('/employeelogin', (req, res) => {
    logger.info('Calling /employeelogin endpoint')
    const sql = "SELECT * FROM employee Where email = ?";
    con.query(sql, [req.body.email], async (err, result) => {
        if(err) {
            logger.error(err)
            return res.json({Status: "Error", Error: "Error in runnig query"});
        }
        if(result.length > 0) {
            bcrypt.compare(req.body.password.toString(), result[0].password, (err, response)=> {
                if(err) {
                    return res.json({Error: "password error"});
                }
                if(response) {
                    const token = jwt.sign({role: "employee", id: result[0].id}, JWT_SECRET_KEY, {expiresIn: '1d'});
                    res.cookie('token', token);
                    return res.json({Status: "Success", id: result[0].id, token})
                } else {
                    return res.json({Status: "Error", Error: "Wrong Email or Password"});
                }
                
            })
            await con.end()
        } else {
            await con.end()
            return res.json({Status: "Error", Error: "Wrong Email or Password"});
        }
    })
})

// app.get('/employee/:id', (req, res) => {
//     const id = req.params.id;
//     const sql = "SELECT * FROM employee where id = ?";
//     con.query(sql, [id], (err, result) => {
//         if(err) return res.json({Error: "Get employee error in sql"});
//         return res.json({Status: "Success", Result: result})
//     })
// })

app.get('/logout', (req, res) => {
    logger.info('Calling /logout endpoint')
    res.clearCookie('token');
    return res.json({Status: "Success"});
})

app.post('/create', (req, res) => {
    logger.info('Calling /create endpoint')
    const sql = "INSERT INTO employee (`name`,`email`,`password`, `address`, `salary`) VALUES (?)";
    bcrypt.hash(req.body.password.toString(), 10, (err, hash) => {
        if(err) {
            logger.error(err)
            return res.json({Error: "Error in hashing password"});
        }
        console.log(req.file)
        const values = [
            req.body.name,
            req.body.email,
            hash,
            req.body.address,
            req.body.salary
        ]
        con.query(sql, [values], async (err, result) => {
            if(err) {
                logger.error(err)
                return res.json({Error: "Inside singup query"});
            }
            await con.end()
            return res.json({Status: "Success"});
        })
    } )
})

// // to run locally
// app.listen(8081, ()=> {
//     console.log("Running");
// })

export const handler = serverless(app);
