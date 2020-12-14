main()

async function main(){

    // indentifie le token selectionné et le pousse dans la variable selectedActor
    let selected = canvas.tokens.controlled;
    if(selected.length > 1 || selected.length == 0){
        ui.notifications.error("Sélectionnez le token qui utilise le pouvoir, et uniquement ce token")
        return;
    }
    let selectedActor = selected[0].actor;  // selected est un tableau donc [0]

    //l'attaquant est-il un joueur ou controllé par un joueur?
    let MysticIsPC = selectedActor.hasPlayerOwner;

    console.log(selected[0]);

    // Recherche tous les items de type power appartenant à selectedActor
    let actorPowers = selectedActor.items.filter(item => item.data?.isMysticalPower ||
                                                         item.data?.name === "Médicus" ||
                                                         item.data?.name === "Érudit" ||
                                                         item.data?.name === "Vision de l'Ombre");

    //evaluate which attribute to use
    let castingAttribute = selectedActor.data.data.attributes["resolute"];
    let resoluteV = selectedActor.data.data.attributes["resolute"].value;
    let hasLeader = selectedActor.items.filter(item => item.data?.name === "Meneur né");
    if(hasLeader.length > 0){
        let persuasiveV = selectedActor.data.data.attributes["persuasive"].value;
        if(resoluteV < persuasiveV) {
            castingAttribute = selectedActor.data.data.attributes["persuasive"];
        }
        console.log("Attribut final:");
        console.log(castingAttribute);
    }


    if(actorPowers.length == 0){
        ui.notifications.error("Le personnage selectionné n'a aucun pouvoir ou talent reconnu par la macro.");
        return;
    }




    // prépare le menu déroulant avec les différents pouvoirs qu'a l'acteur et celui avec les attributs possibles
    let powerOptions = ""
    for(let item of actorPowers){
        powerOptions += `<option value=${item.id}>${item.data.name}</option>`;
    }


    

    //format html de la boite de dialogue. Elle va renvoyer les éléments selectionnés par le joueur : les id weapon, Mod, et avantage
    let dialogTemplate = `
    <h1> Quel pouvoir utilisez-vous? </h1>
    <div style="display:flex">
    <div  style="flex:1"><select     id="power">${powerOptions}</select></div>
    </div>
    <div style="display:flex">

    `

    new Dialog({
        title: "Choix du pouvoir ou du talent", 
        content: dialogTemplate,
        buttons: {
            choosePwr: {
                label: "Choix du pouvoir ou du talent", 
                callback: (html) => {
                    // recupere les éléments selectionnés par le joueur dans la fenetre html et les transforme en variables propres
                    let PowerID = html.find("#power")[0].value;
                    let Pwr = selectedActor.items.find(item => item.id == PowerID)
                    console.log(Pwr);


                    //récupération du niveau
                    let PowerLvl = 1;
                    let lvlName = "Novice";
                    if(Pwr.data.data.master.isActive){
                        PowerLvl = 3;
                        lvlName = "Maître";
                    }
                    else if(Pwr.data.data.adept.isActive){
                        PowerLvl = 2;
                        lvlName = "Adepte";
                    }
                    
                    console.log(PowerID);
                    console.log(PowerLvl);

                    let chatTemplate = "";
                    chatTemplate = `
                    <p> ${selectedActor.data.name} essaie d'utiliser ${Pwr.data.name} au niveau ${lvlName}. </p>
                    `;
                    ChatMessage.create({
                        speaker: {
                        alias: selectedActor.name
                        },
                        content: chatTemplate
                    })

                    console.log("Pouvoir:");
                    console.log(Pwr);
                    const powerName = Pwr.data.name;
                    switch (powerName) {
                        case 'Médicus':
                            castingAttribute = selectedActor.data.data.attributes["cunning"];
                            try{medicus(selectedActor, Pwr, PowerLvl, castingAttribute)} catch(error){
                        
                                ui.notifications.error(error);
                                return;
                            };
                            break;

                        case 'Érudit':
                            castingAttribute = selectedActor.data.data.attributes["cunning"];


                            try{loremaster(selectedActor, Pwr, PowerLvl, castingAttribute)} catch(error){
                        
                                ui.notifications.error(error);
                                return;
                            };
                            break;

                        case 'Soumission':
                            try{bendWill(selectedActor, Pwr, PowerLvl, castingAttribute)} catch(error){
                        
                                ui.notifications.error(error);
                                return;
                            };
                            break;
                        case 'Blessure partagée':
                            try{inheritWound(selectedActor, Pwr, PowerLvl, castingAttribute)} catch(error){
                        
                                ui.notifications.error(error);
                                return;
                            };
                            break;
                        case 'Vision de l\'Ombre':
                            castingAttribute = selectedActor.data.data.attributes["vigilant"];
                                try{witchsight(selectedActor, Pwr, PowerLvl, castingAttribute)} catch(error){
                            
                                    ui.notifications.error(error);
                                    return;
                                };
                                break;
                        default:
                            ui.notifications.error("Ce pouvoir n'est pas encore intégré dans le script");
                        }
                        
                        
                        console.log("fin du switch");



                        

                }
            }, 
            close: {
                label: "Close"
            }
        }
    }).render(true);
}


function getTarget() {
    let targets = Array.from(game.user.targets)  // targets renvoie un ensemble, on le transforme en tableau avec array.from
    if(targets.length == 0 || targets.length > 1 ){
      throw "Choisissez une (seule) cible";
    }
    let targetActor = targets[0].actor;  // targets est un tableau donc [0]
      return targetActor;
}

function bendWill(selectedActor, Pwr, PowerLvl, castingAttribute) {
    // besoin d'une cible
    let targetActor; 
    try{targetActor = getTarget()} catch(error){
        
        throw error;
    };
    console.log("Soumission lancée");
    console.log(targetActor);

    
    let bendChatMessage = "";

    // get target attribute
    let resistValue = targetActor.data.data.attributes["resolute"].value;
    let hasLeader = targetActor.items.filter(item => item.data?.name === "Meneur né");
    if(hasLeader.length > 0){
        let persuasiveV = targetActor.data.data.attributes["persuasive"].value;
        if(resistValue < persuasiveV) {
            resistValue = persuasiveV;
        }
    }
    console.log("Attribut final:");
    console.log(resistValue);
    //roll 1d20
    let roll = new Roll("1d20").evaluate();

    // if the actor performing the action is a player
    if (selectedActor.hasPlayerOwner){
        let Difficulty = castingAttribute.value - resistValue + 10;        
        if(roll.total <= Difficulty){
            bendChatMessage =`
                <p> ${selectedActor.data.name} parvient à imposer sa volonté à ${targetActor.data.name}.</p>
                `
        }
        else{
            bendChatMessage =`
                <p> ${selectedActor.data.name} ne parvient pas à vaincre briser la volonté de ${targetActor.data.name}.</p>
                `
        }
    }
    else{
        let Difficulty = resistValue - castingAttribute.value + 10;        
        if(roll.total <= Difficulty){
            bendChatMessage =`
                <p> ${targetActor.data.name} parvient à résister à la tentative de soumission par ${selectedActor.data.name}.</p>
                `
        }
        else{
            bendChatMessage =`
                <p> ${targetActor.data.name} est contrôlé par ${selectedActor.data.name}.</p>
                `
        }
    }
    ChatMessage.create({
        speaker: {
        alias: selectedActor.name
        },
        content: bendChatMessage
    })
    roll.toMessage();

    return ;
}


function inheritWound(selectedActor, Pwr, PowerLvl, castingAttribute) {
    // besoin d'une cible
    let targetActor; 
    try{targetActor = getTarget()} catch(error){
        
        throw error;
    };
    console.log("Blessure partagée lancée");
    console.log(targetActor);
    return ;
}

function loremaster(selectedActor, Pwr, PowerLvl, castingAttribute) {
    console.log("érudition lancée");
    
    let roll = new Roll("1d20").evaluate();
    roll.toMessage();
    let LoremasterChatMessage = "";

    if(roll.total <= castingAttribute.value){
        LoremasterChatMessage =`
            <p> ${selectedActor.data.name} en sait quelquechose.</p>
            `
    }
    else{
        LoremasterChatMessage =`
            <p> ${selectedActor.data.name} ne sait pas grand chose sur ce sujet.</p>
            `
    }
    ChatMessage.create({
        speaker: {
        alias: selectedActor.name
        },
        content: LoremasterChatMessage
    })
    return ;
}



function medicus(selectedActor, Pwr, PowerLvl, castingAttribute) {
    // besoin d'une cible
    let targetActor; 
    try{targetActor = getTarget()} catch(error){
        
        throw error;
    };

   
    let RemdyDialogTemplate = `
    <h1> Voulez-vous utiliser un remède à base de plantes? </h1>
    `;
    let PlantRemedy = false;
    let healFormula = "1d4";
    let healFormulaMasterFailed = "1d4";

    new Dialog({
        title: "Utilisation ou non d'un remede", 
        content: RemdyDialogTemplate,
        buttons: {
            chooseRem: {
                label: "Avec remède", 
                callback: (html) => {                 
                    PlantRemedy = true;

                    if(PowerLvl == 1){
                        healFormula = "1d6"
                    }
                    else if(PowerLvl == 2){
                        healFormula = "1d8"
                    }
                    else{
                        healFormula = "1d10";
                        healFormulaMasterFailed = "1d6";
                    }
                    medicusHeal(selectedActor, targetActor, PowerLvl, castingAttribute, PlantRemedy, healFormula, healFormulaMasterFailed);
                }
            }, 

            chooseNotRem: {
                label: "Sans remède", 
                callback: (html) => {             
                    PlantRemedy = false;
                    if(PowerLvl == 1){
                        healFormula = "1d4"
                    }
                    else if(PowerLvl == 2){
                        healFormula = "1d6"
                    }
                    else{
                        healFormula = "1d8";
                        healFormulaMasterFailed = "1d4";
                    }
                    medicusHeal(selectedActor, targetActor, PowerLvl, castingAttribute, PlantRemedy, healFormula, healFormulaMasterFailed);
                }
            },
            close: {
                label: "Close"
            }
        }
    }).render(true);
}
       
function medicusHeal(selectedActor, targetActor, PowerLvl, castingAttribute, PlantRemedy, healFormula, healFormulaMasterFailed) {
    let roll = new Roll("1d20").evaluate();
    roll.toMessage();
    let HealChatMessage = "";

    if(roll.total <= castingAttribute.value){

        let healRoll = new Roll(healFormula).evaluate();
        if(targetActor.data.data.health.toughness.value + healRoll.total > targetActor.data.data.health.toughness.max){
            targetActor.data.data.health.toughness.value = targetActor.data.data.health.toughness.max;
        }
        else {targetActor.data.data.health.toughness.value = targetActor.data.data.health.toughness.value + healRoll.total;}

        if(PlantRemedy){
            HealChatMessage =`
            <p> ${selectedActor.data.name} soigne ${targetActor.data.name} avec un remède à base de plantes pour ${healRoll.total} points d'endurance.</p>
            `
        }
        else{
            HealChatMessage = `
            <p> ${selectedActor.data.name} soigne ${targetActor.data.name} (sans remède) pour ${healRoll.total} points d'endurance.</p>
            `
        }
    }
    else{
        if(PowerLvl == 3){
            let healRoll = new Roll(healFormulaMasterFailed).evaluate();
            if(targetActor.data.data.health.toughness.value + healRoll.total > targetActor.data.data.health.toughness.max){
                targetActor.data.data.health.toughness.value = targetActor.data.data.health.toughness.max;
            }
            else {targetActor.data.data.health.toughness.value = targetActor.data.data.health.toughness.value + healRoll.total;}
            if(PlantRemedy){
                HealChatMessage =`
                <p> ${selectedActor.data.name} soigne ${targetActor.data.name} avec un remède à base de plantes pour ${healRoll.total} points d'endurance.</p>
                `
            }
            else{
                HealChatMessage = `
                <p> ${selectedActor.data.name} soigne ${targetActor.data.name} (sans remède) pour ${healRoll.total} points d'endurance.</p>
                `
            }
        }
        else{
            HealChatMessage = `
            <p> Aie! Quelle brute!</p>
            `
        }
    }
    ChatMessage.create({
        speaker: {
        alias: selectedActor.name
        },
        content: HealChatMessage
    })
    console.log("will return");
}

function witchsight(selectedActor, Pwr, PowerLvl, castingAttribute) {
    // besoin d'une cible?
    let targetActor; 
    try{targetActor = getTarget()} catch(error){
        
        throw error;
    };
    console.log("Vision de l'ombre lancée");
    
    console.log(targetActor);
    return ;
}