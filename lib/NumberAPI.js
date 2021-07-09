class NumberAPI {
    constructor(){
    }
    static IsInt(input){
        return typeof input === "number" && input % 1 == 0;
    }
    static IsFloat(input){
        return typeof input === "number" && input % 1 != 0;
    }
}
export {NumberAPI};