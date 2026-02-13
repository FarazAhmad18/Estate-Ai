function sanitizeSearch(str,maxLen=100){
    if(typeof str!=='string') return ''
    return str.trim().slice(0,maxLen)
}

function parsePositiveInt(val,defaultVal=1,max=1000){
    const n=parseInt(val,10)
    if(isNaN(n)||n<1) return defaultVal
    return Math.min(n,max)
}

function isValidId(id){
    const n=Number(id)
    return Number.isInteger(n)&&n>0
}

module.exports={sanitizeSearch,parsePositiveInt,isValidId}
