const err = new Error();
const result = err.message && err.message !== '{}' ? err.message : (JSON.stringify(err) !== '{}' ? JSON.stringify(err) : 'Fallback');
console.log(result);
