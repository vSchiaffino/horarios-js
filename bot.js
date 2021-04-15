const Discord = require('discord.js');
const fs = require("fs")
const cron = require("node-cron")

class Bot extends Discord.Client{
    constructor(){
        super()
        super.login(process.env.TOKEN)
        // Setting up methods
        super.on("message", this.onMessage.bind(this))
        super.on("ready", this.onReady.bind(this))
        // Creating the json files if they dont exist
        for (const path of ["canales.json", "horarios.json"]) {
            if(!fs.existsSync(path)){
                // if not, create the default empty value in the file
                fs.writeFileSync(path, "[]")
            }
        }
        // reading the json files
        this.canales = JSON.parse(fs.readFileSync("canales.json"))
        this.horarios = JSON.parse(fs.readFileSync("horarios.json"))
    }

    
    onReady(){
        this.log(`[INFO] Connected to discord as ${this.user.tag}`)
        this.log(`[INFO] channels\n ${JSON.stringify(this.canales, null, 2)}`)
        this.log(`[INFO] schedules\n ${JSON.stringify(this.horarios, null, 2)}`)
    }
    
    saveChannels(){
        fs.writeFileSync("canales.json", JSON.stringify(this.canales))
    }
    
    saveSchedules(){
        fs.writeFileSync("horarios.json", JSON.stringify(this.horarios))
    }
    
    updateCronSchedules(){
        for (const horario of this.horarios) {
            cron.schedule(horario.at, () => this.sendSchedule(horario))   
        }
    }
    
    async sendSchedule(horario){
        for (const idcanal of this.canales){
            let canal = await this.channels.fetch(idcanal)
            let sendMessage = await canal.send(horario.link)
            sendMessage.delete({timeout: 1000 * 60 * 30})
        }
    }

    unbind(msg){
        let index = this.canales.findIndex(id => id == msg.channel.id)
        let reaction = ""
        if(index == -1)
            reaction = "♿"
        else
            reaction = "❌"
        this.canales.splice(index, 1)
        msg.react(reaction)
        this.saveChannels()
    }

    clear(msg){
        this.horarios = []
        this.saveSchedules()
        msg.react("🔇")
    }

    list(msg){
        let i = 0;
        let final = this.horarios.map(horario => {
            let f = ""
            let partes = horario.at.split(" ")
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
        msg.channel.send( final.join("\n") || "No hay")
        msg.react("✅")
    }

    add(msg){
        let parametros = msg.content.replace(".add ", "")
        parametros = parametros.split(",")
        let at = parametros[0]
        let parametrosAt = at.split(" ")

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
        let horario = {at, link}
        this.horarios.push(horario)
        this.saveSchedules()
        this.updateCronSchedules()
        msg.react("🕐")
    }

    remove(msg){
        let parametros = msg.content.replace(".remove ", "")
        let index = Number(parametros)
        this.horarios.splice(index, 1)
        this.saveSchedules()
        msg.react("✅")
    }

    log(msg){
        console.log(msg)
    }

    onMessage(msg){
        if (msg.content === '.unbind') {
            this.unbind(msg)
        }
        if(msg.content == ".clear"){
            this.clear(msg)
        }
        if(msg.content == ".list"){
            this.list(msg)
        }
        if(msg.content == ".removeall"){
            horarios = []
            this.saveSchedules()
        }
        if (msg.content.startsWith('.remove ')) {
            this.remove(msg)
        }
        if (msg.content === '.bind') {
            if(this.canales.includes(msg.channel.id)){
                msg.react("♿")
                return
            }
            this.canales.push(msg.channel.id)
            this.saveChannels()
            msg.react("✅")
        }
        if(msg.content.startsWith(".add ")){
            this.add(msg)
        }
        if(msg.content.startsWith(".set ")){
            let c = msg.content.replace(".set ", "")
            this.horarios = JSON.parse(c)
            this.saveSchedules()
        }
    }
}

module.exports = Bot