main()

async function main(){
  // indentifie le token selectionné et le pousse dans la variable selectedActor
  let selected = canvas.tokens.controlled;
  if(selected.length == 0 || selected.length > 1){
    ui.notifications.error("Sélectionnez le token qui attaque, et uniquement ce token")
    return;
  }
  let selectedActor = selected[0].actor;  // selected est un tableau donc [0]

  //l'attaquant est-il un joueur ou controllé par un joueur?
  let AttaquantPC = selectedActor.hasPlayerOwner;
  console.log(AttaquantPC);

  // identifie la cible et la pousse dans targetActor
  let targets = Array.from(game.user.targets)  // targets renvoie un ensemble, on le transforme en tableau avec array.from
  if(targets.length == 0 || targets.length > 1 ){
    ui.notifications.error("Selectionnez votre cible (click droit sur le token et icone cible");
    return;
  }
  let targetActor = targets[0].actor;  // targets est un tableau donc [0]
  let targetToken = targets[0];

  // Recherche tous les items de type weapon appartenant à selectedActor
  let actorWeapons = selectedActor.items.filter(item => item.data?.type == "weapon")

  if(actorWeapons.length == 0){
    ui.notifications.error("Le personnage selectionné n'a aucune arme en main.");
    return;
  }


// prépare le menu déroulant avec lesdifférentes armes qu'a l'acteur
  let weaponOptions = ""
  for(let item of actorWeapons){
//    weaponOptions += `<option value=${item.id}>${item.data.name} | ATK: ${item.data.data.attributes.attack.value}</option>`
    weaponOptions += `<option value=${item.id}>${item.data.name} | Attribut: ${item.data.data.attribute}</option>`
  }

//prépare le menu poison
  let poisonOptions = "";
  for(let PoisSt of [
    { label : 'Pas de poison', strenght : 0 },
    { label : 'Poison léger', strenght : 1 },
    { label : 'Poison moyen', strenght : 2 },
    { label : 'Poison fort', strenght : 3 }
  ]){
    poisonOptions += `<option value=${PoisSt.strenght}>${PoisSt.label} </option>`
  }

  //liste des talents de l'attaquant
  let actorAbilities = selectedActor.items.filter(item => item.data?.isAbility);
  let backstabAbil = actorAbilities.filter(item => (item.data.name == "Coup en traître"))
  console.log("coup en traitre?");
  console.log(backstabAbil);


  //format html de la boite de dialogue. Elle va renvoyer les éléments selectionnés par le joueur : les id weapon, Mod, et avantage
  let dialogTemplate = `
  <h1> Quelle arme utilisez-vous? </h1>
  <div style="display:flex">
    <div  style="flex:1"><select     id="weapon">${weaponOptions}</select></div>
    <span style="flex:1">Modificateur <input  id="mod" type="number" style="width:50px;float:right" value=0 /></span>
  </div>
  <div style="display:flex">
    <span style="flex:1">Avantage? <input      id="avntg" type="checkbox" unchecked /></span>
    <span style="flex:1">Attaquant maudit? <input      id="atCurse" type="checkbox" unchecked /></span>
  </div>
  <div style="display:flex">
    <span style="flex:1">Ignore l'armure? <input      id="ign" type="checkbox" unchecked /></span>
  </div>
  <div style="display:flex">
    <span style="flex:1">Modificateur aux dégats? <input  id="modDam" type="text" style="width:80px;float:right" value="0" /></span>
  </div>
  <div style="display:flex">
    <div  style="flex:1"><select     id="poison">${poisonOptions}</select></div>
  </div>
  `


  new Dialog({
    title: "Jet d'attaque", 
    content: dialogTemplate,
    buttons: {
      rollAtk: {
        label: "Jet d'attaque", 
        callback: (html) => {
            // recupere les éléments selectionnés par le joueur dans la fenetre html et les transforme en variables propres
          let wepID = html.find("#weapon")[0].value;
          let wep = selectedActor.items.find(item => item.id == wepID)
          let modifier = html.find("#mod")[0].value;
          let avantage = html.find("#avntg")[0].checked;
          let atCursed = html.find("#atCurse")[0].checked;
          let ignoreArm = html.find("#ign")[0].checked;
          
          let modDam = html.find("#modDam")[0].value;
          let poisonStrenght = html.find("#poison")[0].value;
          
          // préparation des éléments pour le jet d'attaque
          const attckAttribute = wep.data.data.attribute;
          const attribute = selectedActor.data.data.attributes[attckAttribute];
          console.log(attribute);
          let targetVal = attribute.value;
          console.log(targetVal);
          console.log("Poison : ");
          console.log(poisonStrenght);

          let modAdv = 0;
          if(avantage){
            modAdv = -2;
          }
          let modWep = 0;
          if(wep.data.data.qualities.precise){modWep = modWep - 1};
          
          // Calcule le modificateur de défense de la cible
          let defense = targetActor.data.data.combat.defense;
          let defenseMod = defense - 10;
 
          
          // Roll Attack
          let newRollString = ``
          if(atCursed){
              newRollString = `2d20kh + ${modAdv} + ${modWep} + ${modifier} + ${defenseMod}`
          }
          else{
              newRollString = `1d20 + ${modAdv} + ${modWep} +${modifier} + ${defenseMod}`
          }
          let roll = new Roll(newRollString).evaluate();

          // Si attaque <= attribut, elle touche
          let result = roll.total;
          let detail = roll.result;
          let base = roll.dice[0].results[0].result;  //attention si plusieurs dés (cursed), à modifier, ce n'est que le premier
          let basecursed = 0;
          if(atCursed){
            basecursed = roll.dice[0].results[1].result
          }
          console.log(result);
          console.log(detail);
          // Print Chat with Button to Roll Damage
          let chatTemplate = "";
          if(atCursed){
            chatTemplate = `
            <p> Résultats des dés : ${base} /  ${basecursed} </p>
            `;
          }
          else{
            chatTemplate = `
            <p> Résultats des dés : ${base} </p>
            `;
          }

          // let armor = targetActor.data.data.attributes.armor?.value && !ignoreArmor ? targetActor.data.data.attributes.armor?.value : 0;

          let touche = false;



          // a terminer : selon l'attaquant PC ou PNJ
          if(AttaquantPC){
            if(result <= targetVal){
              touche = true;
            }
          }
          else if(result < targetVal){
              touche = true;
          }            
          
          if(touche){
            // traitement de l'attaque réussie, jet de dommage
            let newRollDmgString = "";
            let wepDmg = wep.data.data.damage;
            let modDmg = 0;
            let armorProt = targetActor.data.data.combat.protection;
            let DegAdv = "0";

            // calcul du jet de dommage si l'attaquant est dirigé par un Joueur
            if(AttaquantPC){

             // si arme a la qualite eventreur, degats +1
              if(wep.data.data.qualities.deepImpact){modDmg = modDmg + 1};

              if(avantage){
                DegAdv = "1d4";
              }

              // calcul de l'armure du PNJ
              let armorRoll= new Roll(armorProt).evaluate({maximize: true});
              let armorValue = Math.ceil(armorRoll.total/2);
              console.log("armure du monstre défenseur");
              console.log(armorValue);
              console.log(armorRoll.result);

              //fabrication du pool
              newRollDmgString = wepDmg + " + " + DegAdv + " + " + modDmg + " + " + modDam;
              if(!ignoreArm){
                newRollDmgString += " - " + armorValue;
              }
            } else{
              // calcul du jet de dommage si l'attaquant est un PNJ
              if(avantage){
                DegAdv = "2";
              }
              // calcul de l'arme du PNJ
              let weaponRoll= new Roll(wepDmg).evaluate({maximize: true});
              let weaponValue = Math.ceil(weaponRoll.total /2);
              console.log("arme du monstre attaquant");
              console.log(weaponValue);

              //fabrication du pool
              newRollDmgString = weaponValue + " + " + DegAdv + " + " + modDmg + " + " + modDam; 
              if(!ignoreArm){
                newRollDmgString += " - " + armorProt;
              }
            }
            


            // calcul des dégats
          
            let dmgRoll= new Roll(newRollDmgString).evaluate();
            let dmgTot = Math.max(dmgRoll.total, 0);
            let dmgdetail = dmgRoll.result;
            console.log(wepDmg);
            console.log(dmgTot);
            console.log(dmgdetail);
            targetActor.data.data.health.toughness.value = targetActor.data.data.health.toughness.value - dmgTot;
            let targetDies = false;
            if(targetActor.data.data.health.toughness.value <= 0){
              targetActor.data.data.health.toughness.value = 0;
              targetDies = true;
              const skullEffect = "icons/svg/skull.svg";
              targetToken.toggleEffect(skullEffect);
            }

            chatTemplate += `
            <p> Total du jet d'attaque : ${detail} = ${result} réussi sous votre attribut (${targetVal})</p>
            <p> ${selectedActor.data.name} touche ${targetActor.data.name}</p>
            <p> Dégats : ${dmgTot} </p>
            <p> Décomposition des Dégats : ${dmgdetail} </p>
            `;

            let poisonDamage = "0";
            let poisonRounds = "0";
            let alreadyPoisoned = false;
            let poisonedTimeLeft = 0;

            //poison effect
            if(poisonStrenght > 0 && !targetDies && dmgTot > 0){
              const effect = "icons/svg/poison.svg";
              

              switch (poisonStrenght) {
                case "1":
                  if(AttaquantPC){
                    poisonDamage = "1d4";
                    poisonRounds = "1d4";
                  }
                  else{
                    poisonDamage = "2";
                    poisonRounds = "2";
                  };
                  break;
                case "2":
                  if(AttaquantPC){
                    poisonDamage = "1d6";
                    poisonRounds = "1d6";
                  }
                  else{
                    poisonDamage = "3";
                    poisonRounds = "3";
                  };
                  break;
                case "3":
                  if(AttaquantPC){
                    poisonDamage = "1d8";
                    poisonRounds = "1d8";
                  }
                  else{
                    poisonDamage = "4";
                    poisonRounds = "4";
                  };
                  break;
                }

                let poisonedEffectCounter = EffectCounter.findCounter(targetToken, effect);
  
              
                if(poisonedEffectCounter != undefined){
                  //target already poisoned
                  alreadyPoisoned = true;
                  //get the number of rounds left
                  poisonedTimeLeft = EffectCounter.findCounterValue(targetToken, effect);
                  console.log(poisonedTimeLeft);

                  let PoisonRoundsRoll= new Roll(poisonRounds).evaluate();

                  chatTemplate += `
                  <p> ${targetActor.data.name} était déjà empoisonné pour ${poisonedTimeLeft} rounds</p>
                  `;

                  let NewPoisonRounds = PoisonRoundsRoll.total;

                  if(NewPoisonRounds > poisonedTimeLeft){
                    poisonedEffectCounter.setValue(NewPoisonRounds,targetToken, false);
                    poisonedEffectCounter.update();
                    chatTemplate += `
                  <p> La durée du poison est prolongée, l'effet durera encore ${NewPoisonRounds} rounds</p>
                  `;
                  } else{
                    chatTemplate += `
                  <p> La durée du poison reste inchangée</p>
                  `;
                  }
                }
                else{
                  //nouvel empoisonnement
                  let poisonRoundsRoll= new Roll(poisonRounds).evaluate();
                  poisonedTimeLeft = poisonRoundsRoll.total;

                  
                  let poisonedEffect = new EffectCounter(poisonedTimeLeft, effect, targetToken, false);
                  poisonedEffect.update();

                  chatTemplate += `
                  <p> ${targetActor.data.name} est empoisonné, et recevra ${poisonDamage} dégâts pendant ${poisonedTimeLeft} rounds</p>
                  <p> ${targetActor.data.name} commencera à prendre les dommages lors de sa prochaine action (à faire à la main!)</p>
                  `;
                  };
               };

            
            if(targetActor.data.data.health.toughness.value <= 0){
              chatTemplate += `
              <p> ${targetActor.data.name} est mortellement touché et s'éffondre.</p>
              `;
            }
            else if(dmgTot >= targetActor.data.data.health.toughness.threshold){
              chatTemplate += `
              <p> ${targetActor.data.name} est sonné, et doit choisir entre tomber à terre, ou s'exposer à une attaque gratuite de ${selectedActor.data.name}</p>
              `;
            };


          }
          else {
              // attaque ratée
              chatTemplate += `
              <p> Total du jet d'attaque : ${detail} = ${result} plus grand que l'attribut (${targetVal})</p>
              <p> ${selectedActor.data.name} manque ${targetActor.data.name}</button></p>
              `
          }
          ChatMessage.create({
              speaker: {
                alias: selectedActor.name
              },
              content: chatTemplate,
              roll: roll
          })
        }
      }, 
      close: {
        label: "Close"
      }
    }
  }).render(true)
}