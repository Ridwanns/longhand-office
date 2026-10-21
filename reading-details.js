// Relocate existing evidence nodes; source values and saved artifacts are untouched.
export function readingDetails(root,selector){
 if(!root)return;
 const nodes=[...root.querySelectorAll(selector)].filter(node=>!node.closest('.reading-details-dialog'));
 const selected=nodes.filter(node=>!nodes.some(parent=>parent!==node&&parent.contains(node)));
 if(!selected.length)return;
 const button=document.createElement('button'),dialog=document.createElement('dialog');
 button.type='button';button.className='reading-details-button';button.textContent='Data details';button.setAttribute('aria-haspopup','dialog');
 dialog.className='reading-details-dialog';dialog.setAttribute('aria-label','Data details');
 const heading=document.createElement('div');heading.className='reading-details-heading';
 const title=document.createElement('h2');title.textContent='Data details';
 const close=document.createElement('button');close.type='button';close.textContent='Close';
 for(const node of selected){
  const card=node.closest('.pulse-card');
  if(card&&node.matches('details')){node.dataset.readingIndicator=card.querySelector('[data-scorecard-indicator]').dataset.scorecardIndicator;node.querySelector('summary').textContent=card.querySelector('[data-scorecard-indicator]').textContent+' · data';const source=card.querySelector('.pulse-source-name');if(source)node.append(source);}
  if(node.tagName==='FIGCAPTION'){const paragraph=document.createElement('p');paragraph.className=node.className;paragraph.textContent=node.textContent;node.replaceWith(paragraph);selected[selected.indexOf(node)]=paragraph;}
 }
 heading.append(title,close);dialog.append(heading,...selected);root.append(button,dialog);
 button.addEventListener('click',()=>dialog.showModal());close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
}
