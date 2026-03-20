
async function checkDebug() {
  try {
    const res = await fetch('http://localhost:3000/api/debug');
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
}
checkDebug();
