const router = require("express").Router()
const multer = require("multer")
const verifyToken = require("../helpers/check-token")
const getUserByToken = require("../helpers/get-user-by-token")
const diskStorage = require("../helpers/file-storage")
const upload = multer({ storage: diskStorage })
const Party = require("../models/party")

//create party
router.post("/", verifyToken, upload.fields([{ name: "photos" }]), async (req, res) => {
  const { title, description, party_date: partyDate } = req.body

  let files = []
  if (req.files) {
    files = req.files.photos
  }

  if (title == "null" || description == "null" || partyDate == "null")
    return res.status(400).json({ error: "Preencha pelo menos nome, descrição e data!" })

  const token = req.header("auth-token")
  const user = await getUserByToken(token)

  if (!user) {
    return res.status(400).json({ error: "O usuário não existe!" });
  }

  const userId = user._id.toString()

  //create photo array with image path
  let photos = []
  if (files && files.length > 0) {
    files.forEach((photo, i) => {
      photos[i] = photo.path
    })
  }

  const party = new Party({
    title: title,
    description: description,
    partyDate: partyDate,
    privacy: req.body.privacy,
    photos: photos,
    userId: userId
  })

  try {
    const new_party = await party.save()
    return res.json({ error: null, message: "Evento criado com sucesso!", data: new_party })
  } catch (err) {
    return res.status(400).json({ err })
  }
})

//get all parties
router.get("/all", async (req, res) => {
  try {
    //ultimo para ordena de forma que a ultima cadastrada seja a primeira retornada
    const parties = await Party.find({ privacy: false }).sort([['_id: -1']])
    return res.json({ error: null, parties: parties })
  } catch (err) {
    return res.status(400).json({ err })
  }
})

//get user parties
router.get("/user", verifyToken, async (req, res) => {
  const token = req.header("auth-token")
  const user = await getUserByToken(token)
  const userId = user._id.toString()

  try {
    const parties = await Party.find({ userId: userId }).sort([['_id: -1']])
    return res.json({ error: null, parties: parties })
  } catch (err) {
    return res.status(400).json({ err })
  }
})

//get party
router.get("/user/:id", verifyToken, async (req, res) => {
  const token = req.header("auth-token")
  const user = await getUserByToken(token)
  const userId = user._id.toString()
  const id = req.params.id

  try {
    const party = await Party.findOne({ _id: id, userId: userId })
    return res.json({ error: null, party: party })
  } catch (err) {
    return res.status(400).json({ err })
  }
})

//get party external
router.get("/:id", async (req, res) => {
  const id = req.params.id

  try {
    const party = await Party.findOne({ _id: id })

    if (party.privacy === false)
      return res.json({ error: null, party: party })

    const token = req.header("auth-token")
    const user = await getUserByToken(token)
    const userId = user._id.toString()
    const partyUserId = party.userId.toString()

    if (userId === partyUserId)
      return res.json({ error: null, party: party })

    return res.status(400).json({ error: "Este evento é privado!" })
  } catch (err) {
    return res.status(400).json({ error: "Este evento não existe!" })
  }
})

//delete party
router.delete("/", verifyToken, async (req, res) => {
  const token = req.header("auth-token")
  const user = await getUserByToken(token)
  const userId = user._id.toString()
  const id = req.body.id

  try {
    await Party.deleteOne({ _id: id, userId: userId })

    return res.json({ error: null, message: "Evento removido com sucesso!" })
  } catch (err) {
    return res.status(400).json({ err })
  }
})

//update party
router.patch("/", verifyToken, upload.fields([{ name: "photos" }]), async (req, res) => {
  const { title, description, party_date: partyDate, id: partyId, user_id: partyUserId } = req.body

  let files = []
  if (req.files) {
    files = req.files.photos
  }

  if (title == null || description == null || partyDate == null)
    return res.status(400).json({ error: "Preencha pelo menos nome, descrição e data!" })

  const token = req.header("auth-token")
  const user = await getUserByToken(token)
  const userId = user._id.toString()

  if (userId !== partyUserId)
    return res.status(400).json({ error: "Acesso negado!" })

  const party = {
    id: partyId,
    title: title,
    description: description,
    partyDate: partyDate,
    privacy: req.body.privacy,
    userId: userId
  }

  let photos = []
  if (files && files.length > 0) {
    files.forEach((photo, i) => {
      photos[i] = photo.path
    })

    party.photos = photos
  }

  try {
    const updated_party = await Party.findOneAndUpdate({ _id: partyId, userId: userId }, { $set: party }, { new: true })
    return res.json({ error: null, message: "Evento atualizado com sucesso!", party: updated_party })
  } catch (err) {
    return res.status(400).json({ err })
  }
})


module.exports = router