// Independent audit reader; not used by the collection projection functions.
export function auditCsv(text){
 text=text.replace(/^\uFEFF/,'');
 const rows=[];let row=[],cell='',quoted=false,closed=false;
 const emit=()=>{row.push(cell);cell='';closed=false;};
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;continue;}
  if(c==='"'){if(cell||closed)throw Error('Unexpected CSV quote');quoted=true;}
  else if(c===',')emit();else if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;emit();rows.push(row);row=[];}
  else{if(closed)throw Error('Unexpected data after CSV quote');cell+=c;}}
 if(quoted)throw Error('Unclosed CSV quote');if(cell||row.length||closed){emit();rows.push(row);}if(rows[0]?.[0])rows[0][0]=rows[0][0].replace(/^\uFEFF/,'');return rows;
}
