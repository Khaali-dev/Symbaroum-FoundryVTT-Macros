//get item in console
main()

async function main(){
  // get selected token and Actor
  let selected = canvas.tokens.controlled;
  if(selected.length == 0 || selected.length > 1){
    ui.notifications.error("Sélectionnez le token qui attaque, et uniquement ce token")
    return;
  }
  let selectedActor = selected[0].actor;
  // Recherche tous les items de type weapon appartenant à selectedActor
  let actorItems = selectedActor.items.filter(item => item.data?.type == "equipment")
  console.log(actorItems)
}

main()

async function main(){
  let chatTemplate = `
  <p style="display: flex;
  flex-direction: row;
  flex-basis: calc(50% - 15px);"> </p>
  `;


  ChatMessage.create({
    speaker: {
      alias: selectedActor.name
    },
    content: chatTemplate
  })
}