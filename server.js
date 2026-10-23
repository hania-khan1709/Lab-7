const http = require('node:http');
const db = {
  students: [
    { id: 1, name: 'Haniya Khan', age: 21, grade: 'A' }
  ],
  teachers: [
    { id: 1, name: 'Sir Ali', subject: 'Computer Science' }
  ],
  attendance: [
    { id: 1, studentId: 1, date: '2026-10-23', status: 'Present' }
  ],
  marks: [
    { id: 1, studentId: 1, subject: 'Data Structures', score: 88 }
  ]
};

let nextId = {
  students: 2,
  teachers: 2,
  attendance: 2,
  marks: 2
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  const reply = (code, body) => {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(body));
  };

  const parts = url.pathname.split('/').filter(Boolean);
  const resource = parts[0];
  const id = parts[1] ? parseInt(parts[1], 10) : null;

  const validModules = ['students', 'teachers', 'attendance', 'marks'];
  if (!validModules.includes(resource)) {
    return reply(404, { error: 'Route not found. Use /students, /teachers, /attendance, or /marks' });
  }

  const getRequestBody = () => new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { reject(new Error('Invalid JSON payload')); }
    });
  });

  try {
    if (req.method === 'GET' && !id) {
      return reply(200, db[resource]);
    }

    if (req.method === 'GET' && id) {
      const item = db[resource].find(x => x.id === id);
      if (!item) return reply(404, { error: `${resource.slice(0, -1)} not found` });
      return reply(200, item);
    }

    if (req.method === 'POST' && !id) {
      const body = await getRequestBody();
      const newItem = { id: nextId[resource]++, ...body };
      db[resource].push(newItem);
      return reply(201, newItem);
    }

    if (req.method === 'PUT' && id) {
      const index = db[resource].findIndex(x => x.id === id);
      if (index === -1) return reply(404, { error: `${resource.slice(0, -1)} not found` });
      const body = await getRequestBody();
      db[resource][index] = { id, ...db[resource][index], ...body };
      return reply(200, db[resource][index]);
    }

    if (req.method === 'DELETE' && id) {
      const index = db[resource].findIndex(x => x.id === id);
      if (index === -1) return reply(404, { error: `${resource.slice(0, -1)} not found` });
      const deleted = db[resource].splice(index, 1)[0];
      return reply(200, { message: 'Deleted successfully', deleted });
    }

    return reply(400, { error: 'Unsupported HTTP method or endpoint' });
  } catch (err) {
    return reply(400, { error: err.message });
  }
});

server.listen(3002, () => {
  console.log('Student Management API running at http://localhost:3003');
});