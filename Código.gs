function doGet(e){

if(e && e.parameter){

if(e.parameter.r){
return paginaRevelar(e.parameter.r)
}

if(e.parameter.admin){
return HtmlService.createHtmlOutputFromFile("admin")
}

}

return HtmlService
.createHtmlOutputFromFile("index")
.setTitle("Amigo Invisible")
.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)

}

/* REVELAR AMIGO */

function paginaRevelar(token){

const props=PropertiesService.getScriptProperties().getProperties()

for(var key in props){

if(key.startsWith("sorteo_")){

const sorteo=JSON.parse(props[key])

const asignacion=sorteo.asignaciones.find(a=>a.token===token)

if(asignacion){

const html=`
<html>
<head>
<style>
body{
font-family:Arial;
background:#0b1120;
color:white;
text-align:center;
padding:40px
}

.box{
background:#111;
padding:40px;
border-radius:20px;
max-width:400px;
margin:auto
}

.hidden{
opacity:0;
transform:scale(.5);
transition:1s
}

.show{
opacity:1;
transform:scale(1)
}
</style>
</head>

<body>

<div class="box">

<h1>🎁 Amigo Invisible</h1>

<p>Hola <b>${asignacion.de}</b></p>

<h2 id="loading">Preparando tu regalo...</h2>

<h1 id="resultado" class="hidden">${asignacion.para}</h1>

</div>

<script>

setTimeout(()=>{
document.getElementById("loading").innerText="Tu amigo invisible es..."
},1500)

setTimeout(()=>{
document.getElementById("resultado").classList.add("show")
},3000)

</script>

</body>
</html>
`

return HtmlService.createHtmlOutput(html)

}

}

}

return HtmlService.createHtmlOutput("Link no válido")

}

/* CREAR SORTEO */

function crearSorteo(nombre,participantes){

const id=Utilities.getUuid()

const sorteo={
id:id,
nombre:nombre,
participantes:participantes,
asignaciones:[]
}

guardarSorteo_(sorteo)

return sorteo

}

/* GENERAR ASIGNACIONES */

function generarAsignaciones(id){

const sorteo=obtenerSorteo_(id)

const participantes=sorteo.participantes

const base=participantes.map((_,i)=>i)

let shuffled

do{
shuffled=mezclar_(base.slice())
}
while(!esDerangement_(base,shuffled))

const asignaciones=participantes.map((p,i)=>{

const amigo=participantes[shuffled[i]]

return{
de:p.nombre,
emailDe:p.email,
telefonoDe:p.telefono,
para:amigo.nombre,
token:Utilities.getUuid()
}

})

sorteo.asignaciones=asignaciones

guardarSorteo_(sorteo)

return asignaciones

}

/* WHATSAPP */

function generarLinksWhatsapp(id){

const sorteo=obtenerSorteo_(id)

const baseUrl=ScriptApp.getService().getUrl()

return sorteo.asignaciones.map(a=>{

const telefono=a.telefonoDe

const link=baseUrl+"?r="+a.token

const texto=encodeURIComponent(
"🎁 Hola "+a.de+
"\nTu amigo invisible está listo.\n"+
link
)

return{
nombre:a.de,
url:"https://wa.me/"+telefono+"?text="+texto,
secreto:link
}

})

}

/* EMAIL */

function enviarEmails(id){

const sorteo=obtenerSorteo_(id)

const baseUrl=ScriptApp.getService().getUrl()

sorteo.asignaciones.forEach(a=>{

const link=baseUrl+"?r="+a.token

MailApp.sendEmail({
to:a.emailDe,
subject:"🎁 Tu amigo invisible",
body:
"Hola "+a.de+"\n\n"+
"Tu amigo invisible ya está listo.\n"+
link
})

})

return "Emails enviados"

}

/* EXPORTAR EXCEL */

function exportarExcel(id){

const sorteo=obtenerSorteo_(id)

const ss=SpreadsheetApp.create("Resultados "+sorteo.nombre)

const sheet=ss.getActiveSheet()

sheet.appendRow(["Participante","Email","Telefono","Amigo"])

sorteo.asignaciones.forEach(a=>{
sheet.appendRow([a.de,a.emailDe,a.telefonoDe,a.para])
})

return ss.getUrl()

}

/* ADMIN */

function adminSorteos(){

const props=PropertiesService.getScriptProperties().getProperties()

const lista=[]

for(var key in props){

if(key.startsWith("sorteo_")){
lista.push(JSON.parse(props[key]))
}

}

return lista

}

/* HELPERS */

function guardarSorteo_(s){

PropertiesService
.getScriptProperties()
.setProperty("sorteo_"+s.id,JSON.stringify(s))

}

function obtenerSorteo_(id){

const raw=PropertiesService
.getScriptProperties()
.getProperty("sorteo_"+id)

return raw?JSON.parse(raw):null

}

function mezclar_(arr){

for(var i=arr.length-1;i>0;i--){

var j=Math.floor(Math.random()*(i+1))

var temp=arr[i]
arr[i]=arr[j]
arr[j]=temp

}

return arr

}

function esDerangement_(a,b){

for(var i=0;i<a.length;i++){
if(a[i]===b[i]) return false
}

return true

}