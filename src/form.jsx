import { useState } from "react";

function Student() {
    const [formData, setFormData] = useState({
        name: "",
        roll: "",
        email: "",
        password: ""
    });

    function Change(e) {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    }

    function hogaya(e) {
        e.preventDefault();
        console.log(formData);
        setFormData({
            name: "",
            roll: "",
            email: "",
            password: ""
        });
    }

    return (
        <>
            <h1>Student Registration Form</h1>
            <form onSubmit={hogaya}>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={Change}
                    placeholder="Enter your name"
                />
                <br />
                <input
                    type="text"
                    name="roll"
                    value={formData.roll}
                    onChange={Change}
                    placeholder="Enter your Roll"
                />
                <br />
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={Change}
                    placeholder="Enter your email"
                />
                <br />
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={Change}
                    placeholder="Enter your password"
                />
                <br />

                <button type="submit">Register</button>
            </form>
        </>
    );
}

export default Student;