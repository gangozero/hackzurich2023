from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncpg

async def connect_to_database():
    conn = await asyncpg.connect(user='postgres', password='superpass',
                                  database='holcim', host='127.0.0.1')
    return conn

async def execute_query(query):
    conn = await connect_to_database()
    result = await conn.fetch(query)
    await conn.close()
    return result

app = FastAPI()
db = connect_to_database()

origins = [
    "http://localhost:8000",
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/api/backhaul/{factory_id}/{client_id}')
async def get_source(factory_id, client_id):
    try:
        result_2 = await execute_query(f"SELECT c_id, inbound.name, bc_distance, ac_distance, ab_distance FROM distance_close_view_2 INNER JOIN inbound ON distance_close_view_2.c_id = inbound.id WHERE a_id = '{factory_id}' and b_id = '{client_id}'")
        result = await execute_query(f"SELECT c_id, inbound.name, bc_distance, ac_distance, ab_distance FROM distance_close_view INNER JOIN inbound ON distance_close_view.c_id = inbound.id WHERE a_id = '{factory_id}' and b_id = '{client_id}' ORDER BY bc_distance ASC")
        rows_2 = [row[0] for row in result_2]
        resp = []
        for row in result:
            resp.append({
                'id': row[0],
                'name': row[1],
                'bc_distance': row[2],
                'ac_distance': row[3],
                'ab_distance': row[4],
                'existing': row[0] in rows_2
            })
        return resp
    except Exception as e:
        print(f'Error executing query: {e}')

    
@app.get('/api/backhaule/{factory_id}/{lat}/{lon}')
async def get_source_new_point(factory_id, lat, lon):
    try:
        query = f'''
WITH data AS (
    SELECT 
        inbound_view.a_id AS a_id, 
        inbound_view.c_id AS c_id,
        inbound_view.ac_distance AS ac_distance,
        (SELECT round(ST_Distance(factories.coord, ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326), false)::numeric/1000,1) AS ab_distance),
        (SELECT round(ST_Distance(inbound_view.coord, ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326), false)::numeric/1000,1) AS bc_distance)
    FROM inbound_view INNER JOIN factories
        ON factories.id = inbound_view.a_id
    WHERE a_id = '{factory_id}'
)

SELECT data.c_id, inbound.name, data.bc_distance, data.ac_distance, data.ab_distance 
FROM data  INNER JOIN inbound ON data.c_id = inbound.id
WHERE bc_distance < ab_distance/4
ORDER BY bc_distance ASC
        '''
        result = await execute_query(query)
        resp = []
        for row in result:
            resp.append({
                'id': row[0],
                'name': row[1],
                'bc_distance': row[2],
                'ac_distance': row[3],
                'ab_distance': row[4],
                'existing': False
            })
        return resp
    except Exception as e:
        print(f'Error executing query: {e}')


@app.get('/api/factory')
async def get_factory_list():
    try:

        result = await execute_query("SELECT id, name, lat, lon FROM factories")
        resp = []
        for row in result:
            resp.append({
                'id': row[0],
                'name': row[1],
                'lat': row[2],
                'lon': row[3],
            })
        return resp
    except Exception as e:
        print(f'Error executing query: {e}')

@app.get('/api/customers/{factory_id}')
async def get_customer_list(factory_id):
    try:

        result = await execute_query(f"SELECT id, lat, lon FROM outbound WHERE factory_id = '{factory_id}'")
        resp = []
        for row in result:
            resp.append({
                'id': row[0],
                'lat': row[1],
                'lon': row[2],
            })
        return resp
    except Exception as e:
        print(f'Error executing query: {e}')


@app.get('/api/suppliers/{factory_id}')
async def get_supplier_list(factory_id):
    try:

        result = await execute_query(f"SELECT id, name, lat, lon FROM inbound WHERE factory_id = '{factory_id}'")
        resp = []
        for row in result:
            resp.append({
                'id': row[0],
                'name': row[1],
                'lat': row[2],
                'lon': row[3],
            })
        return resp
    except Exception as e:
        print(f'Error executing query: {e}')