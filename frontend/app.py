from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

# First page → Login
@app.route('/')
def home():
    return redirect(url_for('frontpage'))

@app.route('/frontpage')
def frontpage():
    return render_template('FrontPage.html')

@app.route('/showevent')
def showevent():
    return render_template('Events.html')



@app.route('/about')
def about():
    return render_template('about_us.html')


@app.route('/profile')
def profile():
    return render_template('MyProfile.html')

# Login page
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        # Here later you will connect Firebase auth
        return redirect(url_for('dashboard'))

    return render_template('login_page.html')

@app.route('/register', methods=['GET','POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

    # Here later you will connect Firebase auth
        return redirect(url_for('dashboard'))

    
    return render_template('registration_page.html')

@app.route('/dashboard')
def dashboard():
    return render_template('Dashboard.html')

@app.route('/chat')
def chat():
    return render_template('Chat.html')

if __name__ == "__main__":
    app.run(debug=True)