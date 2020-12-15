main()

async function main(){

    // Get selected token --> selectedActor
    let selected = canvas.tokens.controlled;
    if(selected.length > 1 || selected.length == 0){
        ui.notifications.error("Sélectionnez le token qui utilise le pouvoir, et uniquement ce token")
        return;
    }
    let selectedActor = selected[0].actor;

    // chack wether power using token is controlled by a player
    let MysticIsPC = selectedActor.hasPlayerOwner;

    console.log(selected[0]);

    // Get all powers belonging to selectedActor, and some abilities 
    let actorPowers = selectedActor.items.filter(item => item.data?.isMysticalPower ||
                                                         item.data?.name === "Médicus" ||
                                                         item.data?.name === "Érudit" ||
                                                         item.data?.name === "Vision de l'Ombre");

    if(actorPowers.length == 0){
        ui.notifications.error("Le personnage selectionné n'a aucun pouvoir ou talent reconnu par la macro.");
        return;
    }

    //evaluate which attribute to use (for mystic powers)
    let castingAttribute = selectedActor.data.data.attributes["resolute"];
    let resoluteV = selectedActor.data.data.attributes["resolute"].value;
    let hasLeader = selectedActor.items.filter(item => item.data?.name === "Meneur né");
    if(hasLeader.length > 0){
        let persuasiveV = selectedActor.data.data.attributes["persuasive"].value;
        if(resoluteV < persuasiveV) {
            castingAttribute = selectedActor.data.data.attributes["persuasive"];
        }
        console.log("Mystic power attribut");
        console.log(castingAttribute);
    }

    // building the power menu
    let powerOptions = ""
    for(let item of actorPowers){
        powerOptions += `<option value=${item.id}>${item.data.name}</option>`;
    }
    let dialogTemplate = `
    <h1> Quel pouvoir utilisez-vous? </h1>
    <div style="display:flex">
        <select     id="power">${powerOptions}</select></div>
    </div>
    <div style="display:flex">
        <span style="flex:1">Etes-vous maudit? <input      id="mCursed" type="checkbox" unchecked /></span>
    </div>
    <div style="display:flex">
        <span style="flex:1">La cible est-elle maudite? <input      id="tCursed" type="checkbox" unchecked /></span>
    </div>
    <div style="display:flex">
        <span style="flex:1">Modificateur au jet? <input  id="mod" type="number" style="width:80px;float:right" value=0 /></span>
    </div>
    <div style="display:flex">
        <span style="flex:1">Maintenir un pouvoir déjà actif? <input  id="keep" type="checkbox" unchecked /></span>
    </div>
    `;
    new Dialog({
        title: "Choix du pouvoir ou du talent", 
        content: dialogTemplate,
        buttons: {
            choosePwr: {
                label: "Choix du pouvoir ou du talent", 
                callback: (html) => {
                    // get the power and the link to its data in the actor template
                    let PowerID = html.find("#power")[0].value;
                    let Pwr = selectedActor.items.find(item => item.id == PowerID)
                    let rollData = { 
                        castingAttribute : castingAttribute,
                        modifier : Number(html.find("#mod")[0].value),
                        mysticCursed : html.find("#mCursed")[0].checked,
                        targetCursed : html.find("#tCursed")[0].checked,
                        isMaintained : html.find("#keep")[0].checked
                    }
                    console.log(Pwr);

                    //get power level
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
                    if(!rollData.isMaintained){
                        chatTemplate = `
                        <p> ${selectedActor.data.name} essaie d'utiliser ${Pwr.data.name} au niveau ${lvlName}. </p>
                        `;
                    }
                    else{
                        chatTemplate = `
                        <p> ${selectedActor.data.name} de maintenir ${Pwr.data.name}. </p>
                        `;
                    }
                    ChatMessage.create({
                        speaker: {
                        alias: selectedActor.name
                        },
                        content: chatTemplate
                    })

                    console.log("Pouvoir:");
                    console.log(Pwr);
                    let targetData;
                    const powerName = Pwr.data.name;
                    switch (powerName) {
                        case 'Médicus':
                            rollData.castingAttribute = selectedActor.data.data.attributes["cunning"];
                            
                            // there is no attribute for resistance, resolute is here for compatibility but will be ignored
                            try{targetData = getTarget("resolute")} catch(error){      
                                ui.notifications.error(error);
                                return;
                            }
                         
                            try{medicus(selectedActor, Pwr, PowerLvl, rollData, targetData)} catch(error){
                        
                                ui.notifications.error(error);
                                return;
                            };
                            break;

                            case 'Érudit':
                                rollData.castingAttribute = selectedActor.data.data.attributes["cunning"];
                            try{loremaster(selectedActor, Pwr, PowerLvl, rollData)} catch(error){
                                ui.notifications.error(error);
                                return;
                            };
                            break;

                            case 'Blessure partagée':
                                try{targetData = getTarget("resolute")} catch(error){      
                                    ui.notifications.error(error);
                                    return;
                                }
                                try{inheritWound(selectedActor, Pwr, PowerLvl, rollData, targetData)} catch(error){
                        
                                    ui.notifications.error(error);
                                    return;
                                };
                            break;
                            case 'Malédiction':
                                try{targetData = getTarget("resolute")} catch(error){      
                                    ui.notifications.error(error);
                                    return;
                                }
                                try{curse(selectedActor, Pwr, PowerLvl, rollData, targetData)} catch(error){
                                    ui.notifications.error(error);
                                    return;
                                };
                            break;
                            case 'Soumission':
                                try{targetData = getTarget("resolute")} catch(error){      
                                    ui.notifications.error(error);
                                    return;
                                }
                                try{bendWill(selectedActor, Pwr, PowerLvl, rollData, targetData)} catch(error){
                            
                                    ui.notifications.error(error);
                                    return;
                            };
                            break;
                            case 'Vision de l\'Ombre':
                                rollData.castingAttribute = selectedActor.data.data.attributes["vigilant"];
                                try{witchsight(selectedActor, Pwr, PowerLvl, rollData)} catch(error){
                            
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


//get the target token, its actor, and evaluate which attribute this actor will use for opposition
function getTarget(targetAttributeName) {
    let targets = Array.from(game.user.targets)  // targets renvoie un ensemble, on le transforme en tableau avec array.from
    if(targets.length == 0 || targets.length > 1 ){
      throw "Choisissez une (seule) cible";
    }
    let targetToken = targets[0];
    let targetActor = targets[0].actor;  // targets est un tableau donc [0]
     // get target attribute
    let resistValue = 0;
    if(targetAttributeName != undefined)
    {
        resistValue = targetActor.data.data.attributes[targetAttributeName].value;
        if(targetAttributeName == "resolute")
        {
            let hasLeader = targetActor.items.filter(item => item.data?.name === "Meneur né");
            if(hasLeader.length > 0){
                let persuasiveV = targetActor.data.data.attributes["persuasive"].value;
                if(resistValue < persuasiveV) {
                    resistValue = persuasiveV;
                }
            }
        }

    }
    return{token : targetToken, actor : targetActor, resistValue : resistValue } ;
}

function rollPwr(selectedActor, Pwr, PowerLvl, rollData, targetData) {

    //roll 1d20
    let rollP;
    //check statuses and bonuses that will have the player roll 2 dices, and keep the highest or lowest

    if(selectedActor.hasPlayerOwner){
        if(rollData.mysticCursed){
            rollP = new Roll("1d20kh").evaluate();
        }
        else if(rollData.targetCursed){
            rollP = new Roll("1d20kl").evaluate();
        }
        else{
            rollP = new Roll("1d20").evaluate();
        }
    }
    else{  //the player is the defendant In symbaroum, it is always the player that rolls the dice
        if(rollData.mysticCursed){
            rollP = new Roll("1d20kl").evaluate();
        }
        else if(rollData.targetCursed){
            rollP = new Roll("1d20kh").evaluate();
        }
        else{
            rollP = new Roll("1d20").evaluate();
        }
    }
    rollP.toMessage();

    console.log("result of the roll:");
    console.log(rollP.total);
    return(rollP);
};

function bendWill(selectedActor, Pwr, PowerLvl, rollData, targetData) {

    let rolled = rollPwr(selectedActor, Pwr, PowerLvl, rollData, targetData); 
    console.log("targetdat=");

    let effectChatMessage = "";
    // if the actor performing the action is a player
    if (selectedActor.hasPlayerOwner){

        let difficulty = rollData.castingAttribute.value - targetData.resistValue + 10 + rollData.modifier;
        effectChatMessage =`
        <p> Difficulté = ${difficulty}</p> 
        `;
        if(rolled.total <= difficulty){
            effectChatMessage +=`
                <p> ${selectedActor.data.name} parvient à imposer sa volonté à ${targetData.actor.data.name}.</p>
                `
        }
        else{
            effectChatMessage +=`
                <p> ${selectedActor.data.name} ne parvient pas à vaincre briser la volonté de ${targetData.actor.data.name}.</p>
                `
        }
    }
    else{
        let difficulty = targetData.resistValue - rollData.castingAttribute.value + 10 + rollData.modifier;
        effectChatMessage =`
        <p> Difficulté = ${difficulty}</p> 
        `;      
        if(rolled.total <= Difficulty){
            effectChatMessage +=`
                <p> ${targetData.actor.data.name} parvient à résister à la tentative de soumission par ${selectedActor.data.name}.</p>
                `
        }
        else{
            effectChatMessage +=`
                <p> ${targetData.actor.data.name} est contrôlé par ${selectedActor.data.name}.</p>
                `
        }
    }
    ChatMessage.create({
        speaker: {
        alias: selectedActor.name
        },
        content: effectChatMessage
    })

    return ;
}


function curse(selectedActor, Pwr, PowerLvl, rollData) {
    
    let curseTarget = getTarget();
    const effect = "icons/svg/daze.svg";
    let cursedEffect = new EffectCounter(1, effect, curseTarget.token, false);
    cursedEffect.update();
    
    let effectChatMessage = `<p> ${curseTarget.actor.data.name} est maudit!.</p>`;
    if(PowerLvl == 3)
    {
        effectChatMessage += `<p> ${curseTarget.actor.data.name} est pris de douleurs dès qu'il essaie d'accomplir une action (1d6 dégâts ignorant l'armure).</p>`;
    }
    else{
        effectChatMessage += `<p> ${curseTarget.actor.data.name} n'a vraiment pas de chance (pour chaque action, il jette 2d20 et garde le moins avantageux).</p>`;
    };
    ChatMessage.create({
        speaker: {
        alias: selectedActor.name
        },
        content: effectChatMessage
    })

    return ;
}

function inheritWound(selectedActor, Pwr, PowerLvl, rollData) {
    // besoin d'une cible
    let targetActor; 
    try{targetActor = getTarget()} catch(error){
        
        throw error;
    };
    console.log("Blessure partagée lancée");
    console.log(targetActor);
    return ;
}

function loremaster(selectedActor, Pwr, PowerLvl, rollData) {
    console.log("érudition lancée");
    
    let roll = new Roll("1d20").evaluate();
    roll.toMessage();
    let LoremasterChatMessage = "";

    if(roll.total <= rollData.castingAttribute.value){
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



function medicus(selectedActor, Pwr, PowerLvl, rollData) {
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
                    medicusHeal(selectedActor, targetActor, PowerLvl, rollData, PlantRemedy, healFormula, healFormulaMasterFailed);
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
                    medicusHeal(selectedActor, targetActor, PowerLvl, rollData, PlantRemedy, healFormula, healFormulaMasterFailed);
                }
            },
            close: {
                label: "Close"
            }
        }
    }).render(true);
}
       
function medicusHeal(selectedActor, targetActor, PowerLvl, rollData, PlantRemedy, healFormula, healFormulaMasterFailed) {
    let roll = new Roll("1d20").evaluate();
    roll.toMessage();
    let HealChatMessage = "";

    if(roll.total <= rollData.castingAttribute.value){

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

function witchsight(selectedActor, Pwr, PowerLvl, rollData) {
    // besoin d'une cible?
    let targetActor; 
    try{targetActor = getTarget()} catch(error){
        
        throw error;
    };
    console.log("Vision de l'ombre lancée");
    
    console.log(targetActor);
    return ;
}