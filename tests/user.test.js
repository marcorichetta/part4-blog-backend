const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const User = require('../models/user')

describe('when there is initially one user at db', () => {
    beforeEach(async () => {
        await User.deleteMany({})
        const user = new User({ username: 'root', password: 'root' })
        await user.save()
    })

    test('creation succeeds with a fresh username', async () => {
        // Get users in DB
        const usersAtStart = await helper.usersInDb()

        // Create user object
        const newUser = {
            username: 'rich',
            name: 'marco',
            password: 'rich',
        }

        // Send the user through a POST
        await api
            .post('/api/users')
            .send(newUser)
            .expect(200)
            .expect('Content-Type', /application\/json/)
        
        // Check user has been created
        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd.length).toBe(usersAtStart.length + 1)

        const usernames = usersAtEnd.map(u => u.username)
        expect(usernames).toContain(newUser.username)
    })

    test('creation fails if username already taken', async () => {
        const usersAtStart = await helper.usersInDb()

        // Create root user (Already on DB)
        const newUser = {
            username: 'root',
            name: 'duplicatedUser',
            password: 'root',
        }

        // Save the request response and check
        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('`username` to be unique')

        // Check the user hasn't been created
        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd.length).toBe(usersAtStart.length)
    })

    test('creation fails if username length is < 3', async () => {

        const usersAtStart = await helper.usersInDb()

        // User with short username
        const newUser = {
            username: 'ab',
            name: 'shortName',
            password: 'asd',
        }

        // Save the request response and check
        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        // Semi-regex Mongo validation error
        expect(result.body.error).toContain('`username` ' + `(\`${newUser.username}\`) is shorter than the minimum allowed`)  

        // Check the user hasn't been created
        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd.length).toBe(usersAtStart.length)
    })

    test('creation fails if password length is < 3', async () => {

        const usersAtStart = await helper.usersInDb()

        // User with short password
        const newUser = {
            username: 'dude',
            name: 'shortPassword',
            password: 'ab',
        }

        // Save the request response and check
        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)
        
        expect(result.body.error).toContain('Password must be at least 3 characters long')

        // Check the user hasn't been created
        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd.length).toBe(usersAtStart.length)
    })
})