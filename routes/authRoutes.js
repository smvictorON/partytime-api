const router = require("express").Router()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const User = require("../models/user")

//register user
router.post("/register", async (req, res) => {
  const { name, email, password, confirmpassword } = req.body

  if (name == null || email == null || password == null || confirmpassword == null)
    return res.status(400).json({ error: "Preencha todos os campos!" })

  if (password != confirmpassword)
    return res.status(400).json({ error: "As senhas não conferem!" })

  const email_exists = await User.findOne({ email: email })

  if (email_exists)
    return res.status(400).json({ error: "Email informado já está em uso!" })

  //cria um salt com 12 caracteres
  const salt = await bcrypt.genSalt(12)
  const password_hash = await bcrypt.hash(password, salt)

  const user = new User({
    name: name,
    email: email,
    password: password_hash,
  })

  try {
    const new_user = await user.save()

    //create token
    const token = jwt.sign({
      name: new_user.name,
      id: new_user._id
    }, "secret")

    return res.json({ error: null, message: "Você realizou o cadastro com sucesso!", token: token, userId: new_user._id })
  } catch (err) {
    return res.status(400).json({ err })
  }
})

//login
router.post("/login", async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email: email })

  if (!user)
    return res.status(400).json({ error: "Não há um usuário cadastrado com esse email!" })

  //check if password match
  const check_password = await bcrypt.compare(password, user.password)

  if (!check_password)
    return res.status(400).json({ error: "Senha inválida!" })

  //create token
  const token = jwt.sign({
    name: user.name,
    id: user._id
  }, "secret")

  return res.json({ error: null, message: "Você está autenticado!", token: token, userId: user._id })
})

module.exports = router