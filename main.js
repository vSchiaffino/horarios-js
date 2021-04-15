const Discord = require('discord.js');
const cron = require("node-cron")
const fs = require("fs")
require('dotenv').config();

const client = new Discord.Client();

let canales = JSON.parse(fs.readFileSync("canales.json"))
let horarios = JSON.parse(fs.readFileSync("horarios.json"))

function setUpHorarios(){
    for (const horario of horarios) {
        cron.schedule(horario.at, async () => {
            console.log(canales)
            for (const idcanal of canales) {
                let canal = await client.channels.fetch(idcanal)
                let sendMessage = await canal.send(horario.link)
                sendMessage.delete({timeout: 1000 * 60 * 30})
            }
        })   
    }
}

function saveCanales(){
    fs.writeFileSync("canales.json", JSON.stringify(canales))
}

function saveHorarios(){
    fs.writeFileSync("horarios.json", JSON.stringify(horarios))
}

client.on('ready', () => {
    console.log(`Inicie sesion como: ${client.user.tag}!`);
    setUpHorarios()
});


client.on('message', msg => {
    if (msg.content === '.unbind') {
        let index = canales.findIndex(id => id == msg.channel.id)
        if(index == -1){
            msg.react("♿")
        }
        else{
            msg.react("❌")
        }
        canales.splice(index, 1)
        saveCanales()
    }
    if(msg.content == ".clear"){
        horarios = []
        saveCanales()
        msg.react("🔇")
    }
    if(msg.content == ".list"){
        let i = 0;
        let final = horarios.map(horario => {
            let f = ""
            partes = horario.at.split(" ")
            let minutos = partes[0]
            let horas = partes[1]
            let dia = partes[4]
            let convertDia = {
                "0": "Domingo",
                "1": "Lunes",
                "2": "Martes",
                "3": "Miercoles",
                "4": "Jueves",
                "5": "Viernes",
                "6": "Sabado",
            }
            dia = convertDia[dia]
            f = `[${i}] ${dia} ${horas}:${minutos} - ${horario.link}`
            i += 1
            return f
        })
        msg.channel.send(final.join("\n") || "No hay")
        msg.react("✅")
    }
    if(msg.content == ".removeall"){
        horarios = []
        saveHorarios()
    }
    if (msg.content.startsWith('.remove ')) {
        parametros = msg.content.replace(".add ", "")
        index = Number(parametros)
        horarios.splice(index, 1)
        saveHorarios()
        msg.react("✅")
    }
    if (msg.content === '.bind') {
        canales.push(msg.channel.id)
        saveCanales()
        msg.react("✅")
    }
    if(msg.content.startsWith(".add ")){
        parametros = msg.content.replace(".add ", "")
        parametros = parametros.split(",")
        let at = parametros[0]
        parametrosAt = at.split(" ")

        let convertDias = {
            "domingo": "0",
            "lunes": "1",
            "martes": "2",
            "miercoles": "3",
            "jueves": "4",
            "viernes": "5",
            "sabado": "6",
        }
        let dia = parametrosAt[0]
        dia = convertDias[dia]
        let hora = parametrosAt[1]
        let horapartes = hora.split(":")
        let horas = horapartes[0]
        let mins = horapartes[1]

        let link = parametros[1]
        at = `${mins} ${horas} * * ${dia}`
        console.log(at)
        let horario = {at, link}
        horarios.push(horario)
        setUpHorarios()
        saveHorarios()
        msg.react("🕐")
    }
});


client.login(process.env.TOKEN);