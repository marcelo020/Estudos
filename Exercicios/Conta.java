import java.util.ArrayList;
import java.util.List;

public class Conta {
    private double saldo;
    private double limite = 800;
    private int numero;
    private Agencia agencia;
    private Cliente cliente;
    private List<String> historico = new ArrayList<>();

    public void setSaldo(double saldo) {
        this.saldo = saldo;
    }

    public double getSaldo() {
        return saldo;
    }

    public void setLimite(double limite) {
        this.limite = limite;
    }

    public double getLimite() {
        return limite;
    }

    public void setNumero(int numero) {
        this.numero = numero;
    }

    public int getNumero() {
        return numero;
    }

    public void setAgencia(Agencia agencia) {
        this.agencia = agencia;
    }

    public Agencia getAgencia() {
        return agencia;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public Cliente getCliente() {
        return cliente;
    }

    // Exemplo de método sacar (extra útil)
    public boolean sacar(double valor) {
        if (valor > 0 && valor <= saldo + limite) {
            saldo -= valor;
            historico.add("Saque de R$ " + String.format("%.2f", valor) + " em " + java.time.LocalDate.now());
            return true;
        }
        return false;
    }

    public void deposito(double valor) {
        if (valor > 0) {
            saldo += valor;
            historico.add("Depósito de R$ " + String.format("%.2f", valor) + " em " + java.time.LocalDate.now());
        }
    }

    public double saldoDisponivel() {
        return saldo + limite;
    }

    public boolean transferir(Conta destino, double valor) {
        if (this != destino && valor > 0 && sacar(valor)) {
            destino.deposito(valor);
            historico.add("Transferência de R$ " + String.format("%.2f", valor) + " para conta " + destino.getNumero() + " em " + java.time.LocalDate.now());
            destino.historico.add("Recebimento de R$ " + String.format("%.2f", valor) + " da conta " + this.getNumero() + " em " + java.time.LocalDate.now());
            return true;
        }
        return false;
    }

    public List<String> getHistorico() {
        return new ArrayList<>(historico); // Retorna cópia para evitar modificações externas
    }
}