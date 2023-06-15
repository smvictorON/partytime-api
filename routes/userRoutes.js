const router = require("express").Router()
const bcrypt = require("bcrypt")
const verifyToken = require("../helpers/check-token")
const getUserByToken = require("../helpers/get-user-by-token")
const User = require("../models/user")

//get an user
router.get("/:id", verifyToken, async (req, res) => {
  const id = req.params.id

  try {
    const user = await User.findOne({ _id: id }, { password: 0 })
    return res.json({ error: null, user })
  } catch (err) {
    return res.status(400).json({ error: "O usuário não existe!" })
  }
})

//update an user
router.patch("/", verifyToken, async (req, res) => {
  const token = req.header("auth-token")
  const user = await getUserByToken(token)
  const userId = user._id.toString()

  const {id: userReqId, password, confirmpassword} = req.body

  if(userId != userReqId){
    return res.status(400).json({ error: "Acesso negado!" })
  }

  const updateData = {
    name: req.body.name,
    email: req.body.email
  };

  if (password != confirmpassword)
    return res.status(400).json({ error: "As senhas não conferem!" })
  else if(password == confirmpassword && password != null){
    //change password
    const salt = await bcrypt.genSalt(12)
    const passoword_hash = await bcrypt.hash(password, salt)

    updateData.password = passoword_hash
  }

  try{
    //o ultimo parametro new indica que eu quero o retorno com o doc atualizado
    const updatedUser = await User.findOneAndUpdate({_id: userId}, {$set: updateData}, {new: true})

    return res.json({error: null, message: "Usuário atualizado com sucesso!", data: updatedUser})
  }catch(err){
    return res.status(400).json({ err })
  }

})


module.exports = router