(() => {
"use strict";
const $ = id => document.getElementById(id);
const sceneMeta = {
  ward:["第三病房","沒有登記的病人","./assets/ward.jpg","WARD 03 · 02:17 AM"],
  corridor:["西側走廊","腳步聲比你快半拍","./assets/red-corridor.jpg","WEST WING · SIGNAL LOST"],
  interview:["審訊室","每個問題都像是陷阱","./assets/door.jpg","INTERROGATION · ROOM 02"],
  archive:["地下檔案室","有人替你翻過檔案","./assets/archive.jpg","ARCHIVE · BASEMENT -1"],
  photo:["被撕開的照片","照片裡多了一個人","./assets/photo.jpg","EVIDENCE · PHOTO 04"],
  cctv:["監視器室","鏡頭正在看著你","./assets/cctv.jpg","CCTV · CAM 07"],
  surgery:["手術準備室","器械排列得過分整齊","./assets/chase.jpg","SURGICAL UNIT · LOCKDOWN"],
  exit:["急診出口","門外沒有救護車","./assets/ending.jpg","EMERGENCY EXIT · 03:41 AM"],
  ending:["最後一頁","病例仍然在更新","./assets/doctor.jpg","CASE CLOSED?"]
};
const initial = () => ({
 node:"intro",line:0,clues:[],flags:{},relationship:0,alert:15,distance:72,health:100,
 sound:false,steps:0,ending:null,history:[],visited:{},started:false
});
let state = initial(), typingTimer=null, fullText="", charIndex=0, typing=false, lineReady=false, audioCtx=null, restoredSave=false;
const story = {
 intro:{scene:"ward",chapter:"CASE FILE 01 · 不存在的病人",speaker:"旁白",lines:[
  "你在一張冰冷的病床上醒來。天花板的燈管每隔七秒閃一下，牆上的電子鐘停在 02:17。",
  "你的手腕貼著一張病人標籤。姓名欄被黑筆塗掉，診斷欄卻寫著一行字：『拒絕承認自己吃過她。』",
  "你不是警察，也不是病人家屬。你是犯罪心理顧問林澈。三小時前，你收到一卷錄音帶，裡面是失蹤十年的妹妹林霏的聲音。",
  "錄音最後，她說：『哥哥，如果你真的來了，千萬不要相信穿白袍的人。他會先讓你相信，是你自己想留下來。』"
 ],choices:[
  {text:"檢查手腕上的病人標籤",detail:"先找出自己為何被當成病人。",effects:{clue:"patientTag",alert:2},to:"tag"},
  {text:"立刻離開病房，查看走廊",detail:"先確保出口還在。",effects:{noise:9,alert:8},to:"corridorStart"},
  {text:"找找床邊是否有錄音設備",detail:"也許有人正在監聽。",effects:{clue:"recorder",alert:0},to:"recorder"}
 ]},
 tag:{scene:"ward",chapter:"證物 01 · 病人標籤",speaker:"林澈（心想）",lines:[
  "標籤背面有一串手寫數字：0719。墨水還沒乾透。",
  "你把標籤撕下來時，床底傳來三下很輕的敲擊。停頓。又是三下。像有人在模仿你心跳的節奏。"
 ],choices:[
  {text:"把標籤收進口袋",detail:"保留這項證據。",effects:{clue:"patientTag",alert:0},to:"corridorStart"},
  {text:"掀開床單查看床底",detail:"你可能會找到答案，也可能暴露位置。",effects:{noise:14,alert:10},to:"underBed"}
 ]},
 underBed:{scene:"ward",chapter:"突發事件 · 床底",speaker:"旁白",lines:[
  "床底沒有病人。只有一台老式錄音機，播放鍵自己陷了下去。",
  "錄音裡是你的聲音，疲倦、平靜，像在做一份例行報告：『第七次訪談後，受試者開始把醫生的記憶當成自己的。』",
  "你從未說過這句話。至少，你不記得。床底深處忽然傳來金屬拖地的聲音。"
 ],scare:"noise",choices:[
  {text:"抓起錄音機，立刻離開",detail:"保留錄音，但會發出聲響。",effects:{clue:"recorder",noise:12,alert:8},to:"corridorStart"},
  {text:"關掉錄音機，安靜等候",detail:"暫時降低暴露風險。",effects:{alert:-8,distance:10},to:"corridorStart"}
 ]},
 recorder:{scene:"ward",chapter:"證物 02 · 第七次訪談",speaker:"錄音機",lines:[
  "你在床頭摸到一台微型錄音機。裡面只有一個檔案，檔名是你的出生日期。",
  "播放到一半，一個男人溫柔地說：『林顧問，你每次都會選擇先找錄音機。這次也一樣。』",
  "那不是預錄的聲音。錄音機的計時器正在往前跳，像有人在另一端即時聽著你。"
 ],choices:[
  {text:"拔掉電池",detail:"阻止對方繼續監聽。",effects:{clue:"recorder",alert:-3},to:"corridorStart"},
  {text:"對著錄音機回答：你是誰？",detail:"用心理攻防逼對方露出破綻。",effects:{relationship:1,alert:9},to:"doctorTalk"}
 ]},
 corridorStart:{scene:"corridor",chapter:"CASE FILE 02 · 走廊沒有盡頭",speaker:"旁白",lines:[
  "走廊比從外面看見的長。牆上每一扇門都沒有門牌，只有不同年份的住院腕帶釘在門框上。",
  "你聽見鞋跟落地的聲音。不是從後面傳來，而是從前方的轉角傳來——像有人早已知道你會往哪裡走。",
  "右邊是監視器室，左邊是通往地下室的樓梯。盡頭有一道半掩的門，門後傳來低低的哼歌聲。"
 ],scare:"glitch",choices:[
  {text:"走進監視器室",detail:"查看醫院的即時畫面。",effects:{noise:4},to:"cctv"},
  {text:"沿樓梯去地下檔案室",detail:"找失蹤病人的紀錄。",effects:{noise:7,alert:5},to:"archive"},
  {text:"靠近半掩的門，先聽清楚",detail:"風險較高，但可能找到人。",effects:{alert:8},to:"interview"}
 ]},
 doctorTalk:{scene:"interview",chapter:"心理攻防 · 第一回合",speaker:"陳醫生（錄音）",lines:[
  "「你問我是誰。這是個有趣的問題，林顧問。」",
  "「你一直替別人分辨真話與謊言，卻從來沒有問過：一段記憶，如果每個細節都是真的，它還可能是假的嗎？」",
  "錄音忽然停下。玻璃另一邊傳來一聲輕笑。你看見單向鏡後有個人坐著，雙手平放桌面，像在等你主持一場早已排練好的訪談。"
 ],choices:[
  {text:"指出他知道錄音帶寄出的時間",detail:"測試他是否掌握外界消息。",effects:{relationship:1,alert:4,clue:"doctorKnowledge"},to:"interview"},
  {text:"不回答，記住他的呼吸節奏",detail:"觀察比對話更重要。",effects:{clue:"breathing",alert:-2},to:"archive"}
 ]},
 interview:{scene:"interview",chapter:"CASE FILE 03 · 鏡子另一面",speaker:"陳醫生",lines:[
  "男人穿著乾淨得不合時宜的白袍，胸牌寫著「陳以安」。他沒有問你怎麼進來，只問：『你妹妹最後一次打電話給你時，你有沒有接？』",
  "你記得那天正在替一宗連環失蹤案作證。手機震了三次，你按掉了。翌日，林霏失蹤。",
  "陳醫生把一張照片推到玻璃下方。照片裡的林霏站在醫院門口。拍攝日期卻是明天。照片背後寫著：『第八次，別再讓他走進檔案室。』"
 ],scare:"photo",choices:[
  {text:"承認自己當年沒有接電話",detail:"放下防備，看看他如何回應。",effects:{relationship:2,alert:-4,clue:"photo"},to:"photoReveal"},
  {text:"反問他為何知道你的私人記憶",detail:"把問題還給他。",effects:{relationship:-1,alert:10,clue:"doctorKnowledge"},to:"photoReveal"},
  {text:"假裝相信他，要求看完整病歷",detail:"用合作換取進入檔案室的機會。",effects:{relationship:1,clue:"photo"},to:"archive"}
 ]},
 photoReveal:{scene:"photo",chapter:"證物 03 · 明天的照片",speaker:"旁白",lines:[
  "你把照片對著燈光。林霏身後的玻璃反射出一個模糊人影，白袍、手套、左手少了一截小指。",
  "陳醫生的左手藏在桌下。你只看見他無名指旁邊有一道舊傷，像是被什麼利器切開過。",
  "他說：「照片不是預言。它是證詞。你只是不記得自己曾經拍過它。」"
 ],scare:"flash",choices:[
  {text:"把照片折起來藏好",detail:"證物可能在之後改變選擇。",effects:{clue:"photo",alert:0},to:"archive"},
  {text:"追問照片裡缺指的人",detail:"逼他面對自己的身體特徵。",effects:{relationship:-1,alert:12},to:"surgery"}
 ]},
 archive:{scene:"archive",chapter:"CASE FILE 04 · 被刪除的名字",speaker:"旁白",lines:[
  "地下檔案室沒有窗。每一個抽屜都貼著病人的姓名，但所有標籤都在同一天被重新打過字。",
  "你找到林霏的檔案。封面上不是「失蹤」，而是「自願留院」。簽名是你的。",
  "內頁記錄著七次訪談：每一次，你都要求陳醫生刪除一段記憶。最後一頁的日期是十年前的今晚。你開始懷疑，自己究竟是來救妹妹，還是來完成第八次訪談。"
 ],scare:"glitch",choices:[
  {text:"把檔案完整拍下來",detail:"保留最有力的證據。",effects:{clue:"file",noise:7,alert:6},to:"cctv"},
  {text:"只拿走最後一頁",detail:"更快、更安靜，但會失去部分脈絡。",effects:{clue:"lastPage",noise:2,alert:0},to:"cctv"},
  {text:"搜尋抽屜裡的錄音帶",detail:"也許有另一個版本的你。",effects:{clue:"tape",noise:10,alert:8},to:"cctv"}
 ]},
 cctv:{scene:"cctv",chapter:"CASE FILE 05 · 監視器裡的你",speaker:"旁白",lines:[
  "監視器顯示整棟醫院。畫面裡，你正站在檔案室門口，手裡拿著一份文件。",
  "但監視器時間比你的手錶快了十一分鐘。畫面中的你抬起頭，直視鏡頭，然後用口型說出你的名字。",
  "下一格畫面裡，你身後站著陳醫生。他沒有追你。他只是把手放在你的肩上，像在安慰一個做了噩夢的小孩。"
 ],scare:"glitch",choices:[
  {text:"切換到出口鏡頭",detail:"先找出逃生路線。",effects:{clue:"cctv",alert:0},to:"exitPlan"},
  {text:"放大醫生的手部畫面",detail:"確認他是否缺少一截小指。",effects:{clue:"hand",alert:4},to:"doctorPhoto"},
  {text:"查看自己在病房的畫面",detail:"查明自己醒來前發生過什麼。",effects:{clue:"selfCctv",alert:8},to:"memory"}
 ]},
 doctorPhoto:{scene:"photo",chapter:"影像異常 · 不可能的角度",speaker:"旁白",lines:[
  "畫面放大後出現大量雪花雜訊。陳醫生的手指完整無缺，但他的倒影少了一截小指。",
  "你眨眼時，監視器畫面變成一張靜止照片。照片中的醫生慢慢抬起頭，隔著螢幕望向你。",
  "【影像中斷】"
 ],scare:"jumpscare",choices:[
  {text:"拔掉監視器電源",detail:"停止影像，但警報可能響起。",effects:{noise:14,alert:12,clue:"reflection"},to:"surgery"},
  {text:"拍下螢幕作為證據",detail:"保留倒影異常的紀錄。",effects:{clue:"reflection",alert:4},to:"surgery"}
 ]},
 memory:{scene:"ward",chapter:"記憶缺口 · 第八次",speaker:"旁白",lines:[
  "病房影像裡，你並不是醒來。你是自己走進房間，躺上病床，再把束帶扣好。",
  "影像最後，你對鏡頭說：「如果我又忘記，請讓她活著。」",
  "你終於想起，林霏不是失蹤病人。她是唯一一個成功離開這間醫院的人。而你一次又一次回來，是為了找出當年替她頂罪的人。"
 ],choices:[
  {text:"相信這段記憶，去找妹妹留下的證據",detail:"接受自己的責任。",effects:{clue:"memory",relationship:1},to:"surgery"},
  {text:"認為影像是偽造的，直接逃走",detail:"不再相信任何影像。",effects:{alert:5},to:"exitPlan"}
 ]},
 surgery:{scene:"surgery",chapter:"CASE FILE 06 · 白袍之下",speaker:"陳醫生",lines:[
  "手術準備室裡，所有器械都蓋著白布。沒有血，沒有病人，只有一張椅子和一面鏡子。",
  "陳醫生終於現身。他沒有戴口罩，神情甚至稱得上疲憊。「你一直把我當成怪物，因為這比承認自己做過的事容易。」",
  "他承認自己曾以非法的記憶暗示治療操控病人，但堅稱林霏當年要求他抹去某段記憶，因為她看見了真正的兇手。",
  "「我不是要吃掉他們的身體，林顧問。我吃掉的是他們對自己的確信。這樣的人，連自己是受害者都不敢肯定。」"
 ],scare:"flash",choices:[
  {text:"用病歷和影像證據揭穿他",detail:"需要至少兩項關鍵線索。",requires:{clues:2},effects:{relationship:-2,alert:12},to:"truthCheck"},
  {text:"假裝接受他的說法，要求見林霏",detail:"利用他的自負爭取時間。",effects:{relationship:2,alert:-3},to:"sisterChoice"},
  {text:"趁他說話時衝向出口",detail:"不再參與他的心理遊戲。",effects:{noise:20,alert:20},to:"exitPlan"}
 ]},
 truthCheck:{scene:"interview",chapter:"心理攻防 · 證據與記憶",speaker:"林澈",lines:[
  "你把照片、病歷與監視器影像放在桌上。陳醫生第一次沒有立刻回答。",
  "「你說記憶可以被植入，」你說，「但你忘了，文件上的簽名是十年前的墨水，影像裡的時間卻每次都快十一分鐘。你製造的不是完美謊言，是一個讓人不敢相信自己的迷宮。」",
  "他看向你，輕輕點頭。「很好。那麼現在，告訴我——你想要真相，還是想要一個可以原諒自己的版本？」"
 ],choices:[
  {text:"要求他交出林霏的去向",detail:"把重點放回失蹤者。",effects:{clue:"truth",relationship:-1},to:"sisterChoice"},
  {text:"要求他承認自己偽造病歷",detail:"保存足以定罪的口供。",effects:{clue:"confession",relationship:-2},to:"endingTruth"}
 ]},
 sisterChoice:{scene:"door",chapter:"最後一次選擇 · 門後的人",speaker:"門後的聲音",lines:[
  "門後傳來一個女人的聲音：「哥哥，這次不要替我決定。」",
  "你把手放在門把上。陳醫生沒有阻止你。他只是說：「她不是你記憶裡的妹妹了。你想救的是她，還是十年前那個沒有接電話的自己？」",
  "門縫裡塞出一張紙。上面只有兩句話：『我活著。別相信他。也別相信你自己。』"
 ],choices:[
  {text:"開門，讓妹妹自己說話",detail:"尊重她的選擇，但可能失去證據。",effects:{relationship:2,alert:4},to:"endingSister"},
  {text:"先把紙條和證據帶出去",detail:"優先確保真相不會再次被抹掉。",effects:{clue:"sisterNote",alert:3},to:"endingTruth"},
  {text:"不開門，轉身離開",detail:"接受無法掌控所有答案。",effects:{alert:-5},to:"exitPlan"}
 ]},
 exitPlan:{scene:"corridor",chapter:"CASE FILE 07 · 出口路線",speaker:"旁白",lines:[
  "出口指示燈亮著，但每走十步，燈上的箭頭就轉向另一邊。",
  "身後傳來陳醫生的聲音：「你可以走。你每次都可以走。你只是每次都在最後一刻，想起還有一個問題沒有問完。」",
  "你的呼吸開始變快。醫生距離你只剩下幾十米。遠處有一道緊急出口，也有一個通往外界的服務通道。"
 ],choices:[
  {text:"走緊急出口，直接逃生",detail:"快，但可能把重要真相留在醫院。",effects:{noise:18,alert:16},to:"endingEscape"},
  {text:"走服務通道，避開監視器",detail:"需要冷靜，可能找到真正的出口。",effects:{noise:3,alert:-8},to:"serviceRoute"},
  {text:"回頭面對醫生",detail:"不再逃避那段記憶。",effects:{relationship:-1,alert:8},to:"surgery"}
 ]},
 serviceRoute:{scene:"archive",chapter:"隱藏路線 · 送件紀錄",speaker:"旁白",lines:[
  "服務通道盡頭有一個寄件櫃。裡面放著一疊信封，每封都寄給十年後的你。",
  "最上面那封寫著林霏的字跡：『如果你讀到這裡，代表你終於記起來了。我沒有被他殺死。我逃出去後，把所有證據交給了你。你把證據藏起來，是因為你不相信自己能活著作證。』",
  "你摸到信封內有一張門禁卡。卡片上寫著外部出口的密碼：0719。"
 ],choices:[
  {text:"帶著信封及門禁卡離開",detail:"保留證據，尋找正式途徑揭露真相。",effects:{clue:"sisterLetter",clue2:"keycard",alert:-10},to:"endingTruth"},
  {text:"只帶門禁卡，不再追究",detail:"你可能活下來，但真相仍會被埋藏。",effects:{clue2:"keycard",alert:-12},to:"endingEscape"}
 ]},
 endingTruth:{scene:"ending",chapter:"結局 · 真相曝光",speaker:"旁白",ending:"truth",lines:[
  "天亮時，你走出聖杜蘭醫院。手裡的證據足以重啟十年前的失蹤案。",
  "陳醫生沒有追出來。他站在二樓窗後，像一個終於等到學生交卷的老師。",
  "新聞播出後，醫院被封鎖。警方在地下室找到數十份被篡改的病歷，卻沒有找到陳醫生。",
  "三天後，你收到一封沒有寄件人的信。裡面只有一張新照片：你坐在審訊室裡，對面空著一張椅子。照片背面寫著——『第九次，換我問問題。』"
 ],choices:[{text:"重新開始，嘗試另一條路線",detail:"保留本輪已解鎖的結局記錄。",effects:{},to:"restart"}]},
 endingSister:{scene:"ending",chapter:"結局 · 她自己選擇的路",speaker:"旁白",ending:"sister",lines:[
  "門後的女人走出來。她比記憶裡成熟，也比記憶裡冷靜。她沒有擁抱你，只把一支錄音筆交到你手上。",
  "「我不是等你來救我，哥哥。我是等你停止替我編一個你能接受的故事。」",
  "你們一起走出醫院。她沒有說原諒，也沒有說永遠不再見。這一次，至少她的選擇屬於她自己。"
 ],choices:[{text:"重新開始，探索其他結局",detail:"不同證據會打開不同真相。",effects:{},to:"restart"}]},
 endingEscape:{scene:"exit",chapter:"結局 · 逃出生天",speaker:"旁白",ending:"escape",lines:[
  "你衝出醫院，雨水打在臉上。大門在你身後緩緩關上，沒有警報，也沒有追逐。",
  "你活下來了。但你沒有帶走足夠的證據，沒有人會相信你關於陳醫生的說法。",
  "手機收到一條未知訊息：『做得好。下次，記得帶上最後一頁。』"
 ],choices:[{text:"重新開始，這次帶走更多證據",detail:"調查其他房間，改變結局。",effects:{},to:"restart"}]},
 endingCaught:{scene:"surgery",chapter:"結局 · 新病人",speaker:"陳醫生",ending:"caught",lines:[
  "你聽見門鎖落下。陳醫生替你整理好衣領，像替一位遲到的客人拉開椅子。",
  "「別擔心，林顧問。你很快就會忘記自己為什麼害怕。」",
  "牆上的病人名冊多了一行新字。你的名字沒有被塗掉。"
 ],choices:[{text:"重新開始",detail:"每個選擇都可能改變你的命運。",effects:{},to:"restart"}]},
 endingLoop:{scene:"cctv",chapter:"結局 · 第八次循環",speaker:"旁白",ending:"loop",lines:[
  "你終於走到出口，推開門，卻回到第三病房。電子鐘仍然停在 02:17。",
  "床頭多了一台錄音機。播放鍵自己陷了下去。",
  "錄音裡，你的聲音平靜地說：「第八次訪談，開始。」"
 ],choices:[{text:"重新開始，打破循環",detail:"試著找出重複發生的原因。",effects:{},to:"restart"}]}
};
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function updateScene(key){
 const m=sceneMeta[key]||sceneMeta.ward;
 document.body.style.setProperty("--scene-bg", `url("${m[2]}")`);
 const im=$("sceneImage"); im.style.opacity="0";
 setTimeout(()=>{im.onload=()=>{im.style.opacity="1"};im.onerror=()=>{im.style.opacity="1"};im.src=m[2];im.alt=m[0]+"場景";if(im.complete&&im.naturalWidth>0)im.style.opacity="1";},120);
 $("sceneTitle").innerHTML=`${m[0]}<span class="scene-sub" id="sceneSub">${m[1]}</span>`;
 $("sceneLabel").textContent=m[3];
}
function updateStatus(){
 $("distanceText").textContent=state.distance<20?"極近 · "+state.distance+"m":state.distance<45?"接近 · "+state.distance+"m":"遠處 · "+state.distance+"m";
 $("distanceMeter").style.width=(100-state.distance)+"%";
 $("alertText").textContent=state.alert>75?"極高":state.alert>45?"偏高":state.alert>25?"注意":"低";
 $("alertMeter").style.width=state.alert+"%";
 $("clueText").textContent=state.clues.length+" 件";
 $("clueMeter").style.width=Math.min(100,state.clues.length*17)+"%";
}
function playTone(kind){
 if(!state.sound)return;
 try{
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  if(!audioCtx)audioCtx=new AC();if(audioCtx.state==="suspended")audioCtx.resume();
  const now=audioCtx.currentTime,osc=audioCtx.createOscillator(),gain=audioCtx.createGain();
  osc.connect(gain);gain.connect(audioCtx.destination);
  if(kind==="sting"){osc.type="sawtooth";osc.frequency.setValueAtTime(280,now);osc.frequency.exponentialRampToValueAtTime(48,now+.42);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.13,now+.025);gain.gain.exponentialRampToValueAtTime(.0001,now+.46);osc.start(now);osc.stop(now+.48)}
  else if(kind==="heartbeat"){osc.type="sine";osc.frequency.setValueAtTime(62,now);osc.frequency.exponentialRampToValueAtTime(38,now+.18);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.10,now+.02);gain.gain.exponentialRampToValueAtTime(.0001,now+.22);osc.start(now);osc.stop(now+.24)}
  else{osc.type="square";osc.frequency.setValueAtTime(130,now);osc.frequency.setValueAtTime(72,now+.08);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.045,now+.01);gain.gain.exponentialRampToValueAtTime(.0001,now+.17);osc.start(now);osc.stop(now+.18)}
 }catch(e){}
}
function effect(kind){
 if(kind==="flash"||kind==="glitch"||kind==="photo"||kind==="jumpscare"||kind==="noise"){
  if(kind==="flash"||kind==="photo"||kind==="jumpscare"){const f=$("flash");f.classList.remove("fire");void f.offsetWidth;f.classList.add("fire")}
  if(kind==="glitch"||kind==="photo"||kind==="jumpscare"||kind==="noise"){const n=$("noise");n.classList.remove("fire");void n.offsetWidth;n.classList.add("fire")}
  if(kind==="jumpscare"||kind==="photo"){const j=$("jump");j.classList.remove("fire");void j.offsetWidth;j.classList.add("fire");playTone("sting")}
  else playTone("static");
 }
}
function persist(){try{localStorage.setItem("mq-v8-save",JSON.stringify(state))}catch(e){}}
function loadSave(){try{const s=JSON.parse(localStorage.getItem("mq-v8-save")||localStorage.getItem("mq-v7-save"));if(s&&s.started){state=s;restoredSave=true;return true}}catch(e){}return false}
function render(){
 updateStatus();
 const node=story[state.node];if(!node)return;
 updateScene(node.scene);
 $("chapter").textContent=node.chapter||"CASE FILE";
 $("speaker").textContent=node.speaker||"旁白";
 $("choices").classList.add("hidden");$("choices").innerHTML="";
 $("continueBtn").classList.remove("hidden");
 $("tapHint").textContent="點一下繼續；打字途中可顯示全文";
 showCurrentLine();
}
function showCurrentLine(){
 const node=story[state.node];if(!node)return;
 if(state.line>=node.lines.length){typing=false;lineReady=true;$("dialogue").textContent=node.lines[node.lines.length-1]||"";$("continueBtn").textContent="查看選擇　›";$("tapHint").textContent="選擇會影響後續劇情";$("continueBtn").onclick=advance;return}
 fullText=node.lines[state.line];charIndex=0;typing=true;lineReady=false;
 $("dialogue").textContent="";$("continueBtn").textContent="跳過打字　›";$("continueBtn").onclick=advance;
 typeNext();
}
function typeNext(){
 if(!typing)return;
 const node=story[state.node],speed=state.sound?27:19;
 if(charIndex<fullText.length){$("dialogue").textContent+=fullText.charAt(charIndex++);typingTimer=setTimeout(typeNext,speed)}
 else{typing=false;lineReady=true;$("continueBtn").textContent=state.line<node.lines.length-1?"繼續　›":"查看選擇　›";$("tapHint").textContent=state.line<node.lines.length-1?"點一下閱讀下一句":"準備作出選擇"}
}
function advance(){
 if(typing){clearTimeout(typingTimer);typing=false;$("dialogue").textContent=fullText;lineReady=true;$("continueBtn").textContent=state.line<story[state.node].lines.length-1?"繼續　›":"查看選擇　›";return}
 const node=story[state.node];if(state.line<node.lines.length-1){state.line++;showCurrentLine();return}
 showChoices(node);
}
function showChoices(node){
 $("continueBtn").classList.add("hidden");$("tapHint").textContent="每個決定都會留下痕跡";
 const box=$("choices");box.innerHTML="";
 let choices=(node.choices||[]).filter(c=>!c.requires||((c.requires.clues||0)<=state.clues.length));
 if(node.ending && state.alert>=92 && node.ending!=="caught"){choices=choices}
 choices.forEach((c,i)=>{
  const b=document.createElement("button");b.className="choice";
  b.innerHTML=`<span class="num">0${i+1}</span><span><b>${c.text}</b><small>${c.detail||""}</small></span>`;
  b.addEventListener("click",()=>choose(c));box.appendChild(b);
 });
 box.classList.remove("hidden");persist();
}
function applyEffects(e={}){
 if(e.clue&&!state.clues.includes(e.clue))state.clues.push(e.clue);
 if(e.clue2&&!state.clues.includes(e.clue2))state.clues.push(e.clue2);
 if(e.relationship)state.relationship=clamp(state.relationship+e.relationship,-5,8);
 if(e.alert)state.alert=clamp(state.alert+e.alert,0,100);
 if(e.noise){state.alert=clamp(state.alert+Math.round(e.noise*.45),0,100);state.distance=clamp(state.distance-Math.round(e.noise*.75),4,100)}
 if(e.distance)state.distance=clamp(state.distance+e.distance,4,100);
}
function choose(c){
 state.history.push({node:state.node,choice:c.text});state.steps++;applyEffects(c.effects);
 const old=state.node;state.node=c.to;state.line=0;
 if(state.node==="restart"){restart();return}
 if(state.alert>=96 && !["endingTruth","endingSister","endingEscape","endingCaught","endingLoop"].includes(state.node)){
  state.node="endingCaught";state.ending="caught";
 }else if(state.distance<=8 && !["endingTruth","endingSister","endingEscape","endingCaught","endingLoop"].includes(state.node)){
  state.node="endingCaught";state.ending="caught";
 }else if(state.steps>=16 && state.clues.length<2 && !["endingTruth","endingSister","endingEscape","endingCaught","endingLoop"].includes(state.node)){
  state.node="endingLoop";state.ending="loop";
 }
 const next=story[state.node];if(next&&next.ending)state.ending=next.ending;
 state.visited[state.node]=true;
 if(next&&next.scare)effect(next.scare);
 if(state.distance<35||state.alert>55)playTone("heartbeat");
 $("logline").textContent=`記錄：第 ${state.steps} 個決定 · 警戒 ${state.alert}% · 線索 ${state.clues.length} 件。`+
  (state.history.length?` 上一步：${state.history[state.history.length-1].choice}`:"");
 render();persist();
}
function restart(){
 const keepSound=state.sound, endings=JSON.parse(localStorage.getItem("mq-v8-endings")||"[]");
 if(state.ending&&!endings.includes(state.ending)){endings.push(state.ending);localStorage.setItem("mq-v8-endings",JSON.stringify(endings))}
 state=initial();state.sound=keepSound;state.started=true;state.node="intro";state.visited.intro=true;
 $("cover").classList.add("hidden");render();persist();
}
function start(){
 if(restoredSave){restoredSave=false;$("cover").classList.add("hidden");render();return;}
 state=initial();state.started=true;state.node="intro";state.line=0;state.visited.intro=true;
 $("cover").classList.add("hidden");render();persist();
}
function toggleSound(){
 state.sound=!state.sound;
 $("soundToggle").textContent=state.sound?"♫ 音效：開":"♫ 音效：關";
 $("coverSound").setAttribute("aria-pressed",String(state.sound));
 $("coverSound").setAttribute("aria-label",state.sound?"關閉音效":"開啟音效");
 if(state.sound)playTone("static");
 persist();
}
function openSettings(){
 $("modalTitle").textContent="設定與存檔";
 const endings=JSON.parse(localStorage.getItem("mq-v8-endings")||localStorage.getItem("mq-v7-endings")||"[]");
 $("modalContent").innerHTML=`<p>進度會自動儲存在這部裝置的瀏覽器。清除瀏覽器資料可能會刪除存檔。</p><p>目前線索：${state.clues.length} 件｜決定：${state.steps} 次｜已解鎖結局：${endings.length} 種</p><p>音效目前：${state.sound?"開啟":"關閉"}。你可以點封面右上角喇叭圖示切換音效。</p><p>提示：安靜、收集證據及尊重妹妹的選擇，可能開啟不同結局。</p><button class="tiny" id="resetSave">刪除存檔並重新開始</button>`;
 $("modal").classList.remove("hidden");
 setTimeout(()=>{const r=$("resetSave");if(r)r.onclick=()=>{localStorage.removeItem("mq-v8-save");state=initial();state.started=true;state.node="intro";$("modal").classList.add("hidden");render();persist()}},0);
}
function openAbout(){
 $("modalTitle").textContent="劇情簡介 · 聖杜蘭醫院";
 $("modalContent").innerHTML="<p>十年前，一名病人從聖杜蘭醫院消失。官方紀錄聲稱她從未存在。</p><p>你是犯罪心理顧問林澈。妹妹林霏失蹤後，你收到一卷來自未來的錄音帶。院內醫生陳以安擅長利用記憶、暗示與愧疚操控病人；但他是否就是失蹤案的主謀，沒有人能確定。</p><p>本作為原創心理犯罪懸疑故事。每個決定都可能改變線索、警戒及結局；有些真相只有收集到關鍵證據才會解鎖。</p>";
 $("modal").classList.remove("hidden");
}
function openInstructions(){
 $("modalTitle").textContent="遊戲說明";
 $("modalContent").innerHTML="<p><strong>閱讀對話：</strong>點對話區或「繼續」按鈕前進；打字中的句子點一下可以立即顯示全文，再點一下才前進。</p><p><strong>作出選擇：</strong>不同選擇會改變警戒程度、醫生距離、線索及人物關係，並可能導致不同結局。</p><p><strong>調查線索：</strong>留意病歷、照片、錄音及監視器。收集足夠線索可解鎖額外選項。</p><p><strong>恐怖效果：</strong>遊戲包含突發閃光與驚嚇畫面；可使用封面右上角喇叭圖示控制音效。</p><p><strong>存檔：</strong>進度會自動儲存在目前裝置的瀏覽器。清除網站資料可能刪除存檔。</p>";
 $("modal").classList.remove("hidden");
}
$("coverImageStart").addEventListener("click",start);
$("coverSettings").addEventListener("click",openSettings);
$("coverSound").addEventListener("click",toggleSound);
$("coverAbout").addEventListener("click",openAbout);
$("coverInstructions").addEventListener("click",openInstructions);
$("continueBtn").addEventListener("click",advance);
$("dialogue").addEventListener("click",advance);
$("soundToggle").addEventListener("click",toggleSound);
$("menuBtn").addEventListener("click",openSettings);
$("modalClose").addEventListener("click",()=>$("modal").classList.add("hidden"));
$("modal").addEventListener("click",e=>{if(e.target===$("modal"))$("modal").classList.add("hidden")});
if(loadSave()){
 $("cover").classList.remove("hidden");
 $("coverImageStart").setAttribute("aria-label","繼續已保存的案件進度");
 $("coverSound").setAttribute("aria-pressed",String(state.sound));
 $("coverSound").setAttribute("aria-label",state.sound?"關閉音效":"開啟音效");
 $("soundToggle").textContent=state.sound?"♫ 音效：開":"♫ 音效：關";
}else{
 state=initial();
}
})();