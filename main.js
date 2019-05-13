
const Commands =        ["ADD", "SUB", "DEC", "INC", "BRA", "BEQ", "BNE", "LSL", "LSR", "LD", "ST", "MOV", "NOT", "OR", "AND"];
const IsAddressRef =    [  0,     0,     0,     0,     1,     1,     1,     0,     0,     1,    1,    0,     0,     0,    0];
const IsAddressRegSel = [  0,     0,     0,     0,     0,     0,     0,     0,     0,     1,    1,    0,     0,     0,    0];
const AddRegSel = {
  R0: "11",
  R1: "10",
  R2: "01",
  R3: "00"
}
const RegSel = {
  R3: "000",
  R2: "001",
  R1: "010",
  R0: "011",
  AR: "100",
  SP: "101",
  PC: "110"
}
const AddressMode = {
  IM: "1",
  D: "0"
}

function CommandToHex(Command, Labels = {}) {
  const parts = Command.split(" ");
  const commandInd = Commands.indexOf(parts[0]);
  let BinStr = "";
  BinStr += NumToBin(commandInd, 5)
  if(IsAddressRef[commandInd] === 1) {
    let PartStart = 1;
    if(IsAddressRegSel[commandInd]) {
      BinStr += AddRegSel[parts[PartStart]];
    } else {
      BinStr += "00";
      PartStart = 0;
    }
    BinStr += AddressMode[parts[PartStart + 1]];
    if(parts[PartStart + 1] == "IM") {
      if(Labels[parts[PartStart + 2]]) {
        BinStr += Labels[parts[PartStart + 2]];
      } else {
        BinStr += NumToBin(parseInt(parts[PartStart + 2], 16),8);
      }
    } else {
      BinStr += NumToBin(0, 8);
    }
  } else {
    BinStr += RegSel[parts[1] || "R3"];
    BinStr += RegSel[parts[2] || "R3"];
    BinStr += RegSel[parts[3] || "R3"];
    BinStr += "00";
  }
  const Parts = [BinStr.substr(0,8), BinStr.substr(8,8)];
  const Hexes = Parts.map(p => parseInt(p, 2).toString(16));
  return Hexes;
}
function NumToBin(Num, Len) {
  const nb = Num.toString(2);
  return "0".repeat(Len - nb.length) + nb;
}

let Labels = {}
function Compile(Text) {
  Labels = {};
  Comms = {}; //Location => Command
  const Lines = Text.trim().split("\n");
  let Curr = 0;
  for(let Line of Lines) {
    Line = StripComment(Line);
    if(Line == "") {
      continue;
    }
    const CommAndLabel = SplitLabel(Line);
    const CommParts = CommAndLabel[0].split(" ");
    if(CommParts[0] == "ORG") {
      Curr = parseInt(CommParts[1], 16);
      continue;
    }
    Comms[Curr] = CommAndLabel[0];
    if(CommAndLabel[1]) {
      Labels[CommAndLabel[1]] = NumToBin(Curr, 8);
    }
    Curr += 2;
  }
  let Memory = "v2.0 raw\n";
  for(let k = 0; k < 256; k++) {
    if(Comms[k]) {
      const Hexes = CommandToHex(Comms[k], Labels);
      //console.log(Comms[k], Hexes, Labels)
      Memory += ` ${Hexes[0]}`;
      Memory += ` ${Hexes[1]}`;
      k++;
    } else Memory += " 0";
  }
  return Memory
}
function StripComment(Line) {
  return Line.split("#")[0].trim();
}
function SplitLabel(Line) {
  const Parts = Line.split(":");
  if(Parts.length > 1) {
    return [Parts[1].trim(), Parts[0].trim()];
  } else {
    return [Parts[0].trim()];
  }
}


const TestStr = 
`       ORG 0x20
       LD R0 IM 0x05
       LD R1 IM 0x00
       LD R2 IM 0xA0
       MOV AR R2
LABEL: LD R2 D
       INC AR AR
       ADD R1 R1 R2
       DEC R0 R0
       BNE IM LABEL
       INC AR AR
       ST R1 D
`
const TestStr2 = `
BRA IM 0x20
ORG 0x20
LD R0 IM 0x20
LD R1 IM 0x02
LD R3 IM 0x08
SUB R2 R1 R0
MOV AR R3
ST R2 D
`
if(typeof document !== "undefined") {
  document.querySelector("#Compile").addEventListener("click", () => {
    const str = document.querySelector("#Input").value;
    const Result = Compile(str);
    document.querySelector("#Output").value = Result
  })
  document.querySelector("#Input").value = TestStr
} else {
  const fs = require("fs");
  fs.writeFileSync("./test2.RAM", Compile(TestStr2))
}



//console.log(Compile(TestStr))
